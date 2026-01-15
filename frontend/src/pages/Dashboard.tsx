// frontend/src/pages/Dashboard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users2, Trophy, Calendar, Mail, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
// Assuming you have 'Event' and 'Team' interfaces defined in '@/services/api'
import { eventsAPI, teamsAPI, registrationsAPI, teamMembersAPI, Event, Team } from "@/services/api"; 
import { useAuth } from "@/contexts/AuthContext";

// Define an extended Team interface for the frontend state
interface TeamWithEventName extends Team {
  event_name?: string; // Add the optional event_name field
}

interface TeamInvitation {
  id: number;
  team_name: string;
  event_name: string;
  invited_by_name: string;
}

interface Registration {
  id: number | string; // Must be able to hold string (e.g., "team-reg-1-10")
  event_id: number;
  event_name: string;
  start_datetime?: string;
  venue?: string;
  team_id?: number;
  team_name?: string;
  registration_type: 'individual' | 'team';
  status: string;
  role?: string; // Added for convenience in team registration mapping
}

const Dashboard = () => {
  const navigate = useNavigate();
  
  const { isLoggedIn, userRole, userName, loading: authLoading } = useAuth();
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<Event[]>([]);
  const [myTeams, setMyTeams] = useState<TeamWithEventName[]>([]); // Use the extended interface
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (userRole === 'admin') {
      navigate("/admin");
      return;
    }

    loadDashboardData();
  }, [isLoggedIn, userRole, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const userDataString = localStorage.getItem('user');
      const userData = userDataString ? JSON.parse(userDataString) : null;
      const userId = userData?.id;

      // 1. Fetch ALL events from backend first
      const eventsData = await eventsAPI.getAll();

      // Filter and sort events for Upcoming Competitions card
      const sortedEvents = eventsData
        .filter(event => event.registration_status === 'open')
        .sort((a, b) => {
          const dateA = new Date(a.start_datetime || a.event_date || 0);
          const dateB = new Date(b.start_datetime || b.event_date || 0);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 3);

      setUpcomingCompetitions(sortedEvents);

      // 2. Fetch teams
      try {
        const teamsData = await teamsAPI.getAll();
        if (userId) {
          // Map user teams to include event name
          const userTeams = teamsData
            .filter(team => team.captain_id === userId)
            .map(team => {
                // Find the event details using the event_id
                const event = eventsData.find((e: Event) => e.id === team.event_id);
                
                return {
                    ...team,
                    // Inject the event name for use in the rendering logic below
                    event_name: event?.title || 'Unknown Event', 
                };
            });
          setMyTeams(userTeams as TeamWithEventName[]);
        }
      } catch (teamError) {
        console.log("Teams endpoint error:", teamError);
        setMyTeams([]);
      }

      // 3. Fetch pending invitations
      try {
        const response = await fetch('http://localhost:4000/api/team-members/my-invitations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const invitationsData = await response.json();
          setPendingInvitations(invitationsData);
        }
      } catch (invitationError) {
        console.log("Invitations endpoint error:", invitationError);
        setPendingInvitations([]);
      }

      // 4. Fetch ALL registrations (both individual and team-based)
      try {
        const allRegistrations: Registration[] = [];

        // 4.1. Fetch individual registrations
        try {
          const individualRegs = await registrationsAPI.getMyRegistrations();
          
          // Only process if we have registrations
          if (individualRegs && individualRegs.length > 0) {
            const mappedIndividual = individualRegs.map((reg: any) => ({
              id: reg.id,
              event_id: reg.event_id,
              event_name: reg.event_name,
              start_datetime: reg.start_datetime,
              venue: reg.venue,
              team_id: reg.team_id,
              registration_type: 'individual' as const,
              status: reg.status || 'Registered' 
            }));
            allRegistrations.push(...mappedIndividual);
          }
        } catch (err) {
          console.log("Individual registrations error:", err);
        }

        // 4.2. Fetch team-based registrations (accepted team invitations/memberships)
        try {
          const teamsData = await teamMembersAPI.getMyTeams();
          
          // Only process if we have team data
          if (teamsData && teamsData.length > 0) {
            // Fetch all teams to verify they still exist
            const allTeams = await teamsAPI.getAll();
            const validTeamIds = new Set(allTeams.map(t => t.id));
            
            const mappedTeams = teamsData
              .filter((team: any) => {
                // Filter out memberships for deleted teams
                return validTeamIds.has(team.team_id);
              })
              .map((team: any) => {
                // Find the corresponding Event object to get correct event details
                const event = eventsData.find((e: Event) => e.id === team.event_id);

                return {
                  id: `team-reg-${team.team_id}-${team.event_id}`, 
                  event_id: team.event_id,
                  event_name: event?.title || event?.name || 'Unknown Event', 
                  start_datetime: event?.start_datetime || event?.event_date,
                  venue: event?.venue || event?.location,
                  team_id: team.team_id,
                  team_name: team.team_name,
                  registration_type: 'team' as const,
                  status: 'Confirmed',
                  role: team.captain_id === userId ? 'Captain' : 'Member'
                };
              })
              // Filter out any registrations where the event could not be found
              .filter(reg => reg.event_name !== 'Unknown Event');
            
            allRegistrations.push(...mappedTeams);
          }
        } catch (err) {
          console.log("Team registrations error:", err);
        }

        // Remove duplicates (same event_id) - prioritize team registration if both exist
        const uniqueRegistrations = allRegistrations.reduce((acc: Registration[], curr) => {
          const existsIndex = acc.findIndex(r => r.event_id === curr.event_id); 
          if (existsIndex === -1) {
            acc.push(curr);
          } else {
            // If the current is 'team' and the existing is 'individual', replace it.
            if (curr.registration_type === 'team' && acc[existsIndex].registration_type === 'individual') {
              acc[existsIndex] = curr;
            }
          }
          return acc;
        }, []);

        // Final check: only set registrations if we have valid data
        setMyRegistrations(uniqueRegistrations.length > 0 ? uniqueRegistrations : []);
        
      } catch (competitionError) {
        console.log("Registrations error:", competitionError);
        setMyRegistrations([]);
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (eventId: number, eventTitle: string) => {
    navigate(`/competition/${eventId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-6 py-24">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Participant Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back{userName ? `, ${userName}` : ''}! Manage your competitions and teams.
          </p>
        </div>

        {/* Pending Invitations Alert */}
        {pendingInvitations.length > 0 && (
          <Alert className="mb-6 border-primary/50 bg-primary/5">
            <Mail className="h-4 w-4 text-primary" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong>You have {pendingInvitations.length} pending team invitation{pendingInvitations.length !== 1 ? 's' : ''}!</strong>
                <div className="text-sm text-muted-foreground mt-1">
                  {pendingInvitations.slice(0, 2).map(inv => inv.team_name).join(', ')}
                  {pendingInvitations.length > 2 && ` and ${pendingInvitations.length - 2} more`}
                </div>
              </div>
              <Link to="/invitations">
                <Button size="sm" className="ml-4">
                  View Invitations
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Competitions Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Available Competitions
            </h2>
            <Link to="/competitions">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingCompetitions.length > 0 ? (
              upcomingCompetitions.map((comp) => {
                const isRegistrationOpen = comp.registration_status === 'open';
                const eventDate = comp.start_datetime || comp.event_date;
                const isPastEvent = eventDate ? new Date(eventDate) < new Date() : false;
                const isAlreadyRegistered = myRegistrations.some(r => r.event_id === comp.id);

                return (
                  <Card key={comp.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="flex-1">{comp.title || comp.name}</CardTitle>
                        {isAlreadyRegistered && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500">
                            Registered
                          </span>
                        )}
                        {!isAlreadyRegistered && !isRegistrationOpen && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-500/10 text-red-500">
                            Closed
                          </span>
                        )}
                        {!isAlreadyRegistered && isRegistrationOpen && !isPastEvent && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">
                            Open
                          </span>
                        )}
                      </div>
                      <CardDescription>{comp.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {eventDate && (
                        <p className="text-sm text-muted-foreground">
                          📅 {new Date(eventDate).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        📍 {comp.venue || comp.location || 'Location TBD'}
                      </p>
                      <Link to={`/competition/${comp.id}`}>
                        <Button variant="outline" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Button
                        className="w-full"
                        disabled={!isRegistrationOpen || isPastEvent || isAlreadyRegistered}
                        onClick={() => handleRegister(comp.id, comp.title || comp.name || 'Competition')}
                      >
                        {isAlreadyRegistered ? 'Already Registered' : !isRegistrationOpen ? 'Registration Closed' : isPastEvent ? 'Event Ended' : 'Register'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No competitions available at the moment.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
        
        {/* My Teams Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users2 className="h-6 w-6 text-primary" />
              My Teams
            </h2>
            <Link to="/create-team">
              <Button>Create Team</Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {myTeams.length > 0 ? (
              myTeams.map((team) => (
                <Card key={team.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription>Competition: {team.event_name || `ID: ${team.event_id}`}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Role: Captain</span>
                      <Link to={`/team/${team.id}`}>
                        <Button variant="outline" size="sm">
                          View Team
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">You haven't created any teams yet.</p>
                  <Link to="/create-team">
                    <Button>Create Your First Team</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* My Registrations Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            My Registrations
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {myRegistrations.length > 0 ? (
              myRegistrations.map((reg) => (
                <Card key={reg.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {reg.event_name}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        reg.registration_type === 'team'
                          ? 'bg-purple-500/10 text-purple-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {reg.registration_type === 'team' ? 'Team' : 'Individual'}
                      </span>
                    </CardTitle>
                    {reg.team_name && (
                      <CardDescription>Team: {reg.team_name}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {reg.start_datetime && (
                      <p className="text-sm text-muted-foreground">
                        📅 {new Date(reg.start_datetime).toLocaleDateString()}
                      </p>
                    )}
                    {reg.venue && (
                      <p className="text-sm text-muted-foreground">
                        📍 {reg.venue}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
                        {reg.status}
                      </span>
                      {reg.registration_type === 'team' && reg.role && (
                        <span className="text-sm text-muted-foreground">
                          Role: {reg.role}
                        </span>
                      )}
                    </div>
                    {reg.team_id ? (
                      <Link to={`/team/${reg.team_id}`}>
                        <Button variant="outline" className="w-full" size="sm">
                          View Team
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/competition/${reg.event_id}`}>
                        <Button variant="outline" className="w-full" size="sm">
                          View Competition
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No competition registrations yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;