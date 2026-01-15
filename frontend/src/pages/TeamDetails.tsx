import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users2, Trophy, Crown, Loader2, AlertCircle, Pencil, Trash2, UserPlus, Mail } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { teamsAPI, eventsAPI, Team, Event } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TeamMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface TeamDetailsData extends Team {
  captain_name?: string;
  captain_email?: string;
  event_name?: string;
  members?: TeamMember[];
}

const TeamDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [team, setTeam] = useState<TeamDetailsData | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Invite member dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Remove member state
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (id) {
      fetchTeamDetails(parseInt(id));
    }
  }, [id, isLoggedIn, navigate]);

  const fetchTeamDetails = async (teamId: number) => {
    try {
      setLoading(true);
      setError("");

      // Fetch team data
      const teamData = await teamsAPI.getById(teamId);
      console.log('Team data:', teamData);

      // Fetch the specific event details if event_id exists
      if (teamData.event_id) {
        try {
          const eventData = await eventsAPI.getById(teamData.event_id);
          console.log('Event data:', eventData);
          setEvent(eventData);
          
          // Add event name to team data
          setTeam({
            ...teamData,
            event_name: eventData.title || eventData.name
          });
        } catch (eventError) {
          console.error('Error fetching event:', eventError);
          // Still set team data even if event fetch fails
          setTeam(teamData);
        }
      } else {
        setTeam(teamData);
      }
    } catch (err: any) {
      console.error('Error fetching team details:', err);
      setError(err.response?.data?.message || 'Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    if (team) {
      setEditName(team.name);
      setEditError("");
      setEditDialogOpen(true);
    }
  };

  const handleEditSubmit = async () => {
    if (!editName.trim()) {
      setEditError("Team name is required");
      return;
    }

    if (!team || !id) return;

    try {
      setEditLoading(true);
      setEditError("");

      await teamsAPI.update(parseInt(id), { name: editName });
      
      await fetchTeamDetails(parseInt(id));
      
      setEditDialogOpen(false);
    } catch (err: any) {
      console.error('Error updating team:', err);
      setEditError(err.response?.data?.message || 'Failed to update team');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;

    try {
      setDeleteLoading(true);
      
      await teamsAPI.delete(parseInt(id));
      
      navigate("/dashboard");
    } catch (err: any) {
      console.error('Error deleting team:', err);
      alert(err.response?.data?.message || 'Failed to delete team');
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleInviteMember = () => {
    setInviteEmail("");
    setInviteError("");
    setInviteSuccess("");
    setInviteDialogOpen(true);
  };

  const handleInviteSubmit = async () => {
    if (!inviteEmail.trim()) {
      setInviteError("Email is required");
      return;
    }

    if (!team || !id) return;

    try {
      setInviteLoading(true);
      setInviteError("");
      setInviteSuccess("");

      const response = await fetch('http://localhost:4000/api/team-members/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          team_id: parseInt(id),
          user_email: inviteEmail
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invitation');
      }

      setInviteSuccess("Invitation sent successfully!");
      setInviteEmail("");
      
      // Refresh team data after a short delay
      setTimeout(() => {
        fetchTeamDetails(parseInt(id));
        setInviteDialogOpen(false);
      }, 1500);
      
    } catch (err: any) {
      console.error('Error inviting member:', err);
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      setRemovingMemberId(memberId);

      const response = await fetch(`http://localhost:4000/api/team-members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove member');
      }

      // Refresh team data
      if (id) {
        await fetchTeamDetails(parseInt(id));
      }
      
    } catch (err: any) {
      console.error('Error removing member:', err);
      alert(err.message || 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
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

  if (error || !team) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-6 py-24">
          <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Team not found'}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const isTeamLeader = userData?.id === team.captain_id;

  // Use event_name from team data (injected during fetch) or fall back to event object
  const displayEventName = team.event_name || event?.title || event?.name || `Event #${team.event_id}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-24">
        <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Users2 className="h-10 w-10 text-primary" />
              {team.name}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span>Competition: {displayEventName}</span>
            </div>
          </div>

          {/* Team Leader */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Team Leader
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {team.captain_name || `User #${team.captain_id}`}
                    {isTeamLeader && (
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        You
                      </span>
                    )}
                  </div>
                  {team.captain_email && (
                    <div className="text-sm text-muted-foreground">{team.captain_email}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Captain ID: {team.captain_id}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Team Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Team ID:</span>
                <span className="font-medium">{team.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Competition:</span>
                <span className="font-medium">{displayEventName}</span>
              </div>
              {event?.event_date && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Event Date:</span>
                  <span className="font-medium">
                    {new Date(event.event_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {event?.location && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{event.location}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">
                  {new Date(team.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users2 className="h-5 w-5 text-primary" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    {team.members && team.members.length > 0 
                      ? `Total members: ${team.members.length}` 
                      : 'No members yet'}
                  </CardDescription>
                </div>
                {isTeamLeader && (
                  <Button onClick={handleInviteMember} size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {team.members && team.members.length > 0 ? (
                <div className="space-y-3">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {member.name}
                          {member.role === "Leader" && (
                            <Crown className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Role: {member.role}
                        </div>
                      </div>
                      {isTeamLeader && member.user_id !== team.captain_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removingMemberId === member.id}
                        >
                          {removingMemberId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No team members yet</p>
                  {isTeamLeader && (
                    <p className="text-sm mt-2">
                      Click "Invite Member" to add team members
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Leader Actions */}
          {isTeamLeader && (
            <div className="mt-6 flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleEditClick}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Team
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Team
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Edit Team Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update your team name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter team name"
                disabled={editLoading}
              />
            </div>
            {editError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={editLoading}>
              {editLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Enter the email address of the user you want to invite
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={inviteLoading}
              />
            </div>
            {inviteError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{inviteError}</AlertDescription>
              </Alert>
            )}
            {inviteSuccess && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{inviteSuccess}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
              disabled={inviteLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleInviteSubmit} disabled={inviteLoading}>
              {inviteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team
              <span className="font-semibold"> "{team?.name}"</span> and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Team'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamDetails;