import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Users2, Calendar, Loader2, UsersRound } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  participants: number;
  competitions: number;
  teams: number;
  schedules: number;
  teamMembers: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userRole, loading: authLoading } = useAuth(); // Added loading
  const [stats, setStats] = useState<DashboardStats>({
    participants: 0,
    competitions: 0,
    teams: 0,
    schedules: 0,
    teamMembers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Wait for auth check to complete
    if (authLoading) return;

    if (!isLoggedIn) {
      navigate('/admin-login');
      return;
    }

    if (userRole !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchStats();
  }, [isLoggedIn, userRole, authLoading, navigate]); // Added authLoading

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [participantsRes, competitionsRes, teamsRes, teamMembersRes] = await Promise.all([
        fetch('http://localhost:4000/api/users/count'),
        fetch('http://localhost:4000/api/events/count'),
        fetch('http://localhost:4000/api/teams/count'),
        fetch('http://localhost:4000/api/admin/team-members-count'),
      ]);

      const participantsData = await participantsRes.json();
      const competitionsData = await competitionsRes.json();
      const teamsData = await teamsRes.json();
      const teamMembersData = await teamMembersRes.json();

      setStats({
        participants: participantsData.count || 0,
        competitions: competitionsData.count || 0,
        teams: teamsData.count || 0,
        schedules: competitionsData.count || 0,
        teamMembers: teamMembersData.count || 0,
      });
      setError("");
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const adminSections = [
    {
      title: "Manage Participants",
      description: "View and manage participant records",
      icon: Users,
      link: "/admin/participants",
      count: stats.participants,
    },
    {
      title: "Manage Competitions",
      description: "Create and manage competition details",
      icon: Trophy,
      link: "/admin/competitions",
      count: stats.competitions,
    },
    {
      title: "Manage Teams",
      description: "View and manage all registered teams",
      icon: Users2,
      link: "/admin/teams",
      count: stats.teams,
    },
    {
      title: "Team Members Overview",
      description: "View all team members across competitions",
      icon: UsersRound,
      link: "/admin/team-members",
      count: stats.teamMembers,
    },
    {
      title: "Manage Schedules",
      description: "Set competition dates, times, and venues",
      icon: Calendar,
      link: "/admin/schedules",
      count: stats.schedules,
    },
  ];

  // Show loading while auth is checking
  if (authLoading || loading) {
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
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage all system records and data</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-6 w-6 text-primary" />
                    {section.title}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-primary">{section.count}</span>
                    <Link to={section.link}>
                      <Button>Manage</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Admin;