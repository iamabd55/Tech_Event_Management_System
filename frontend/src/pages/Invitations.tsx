import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Check, X, Users2, Trophy, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Invitation {
  id: number;
  team_id: number;
  team_name: string;
  event_name: string;
  invited_by_name: string;
  status: string;
  joined_at: string;
}

const Invitations = () => {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    fetchInvitations();
  }, [isLoggedIn, navigate]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch('http://localhost:4000/api/team-members/my-invitations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to fetch invitations');
      }

      const data = await response.json();
      setInvitations(data);
    } catch (err: any) {
      console.error('Error fetching invitations:', err);
      setError(`Unable to load invitations. ${err.message}`);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: number, teamName: string) => {
    try {
      setProcessingId(invitationId);
      setSuccessMessage("");

      const response = await fetch(`http://localhost:4000/api/team-members/accept/${invitationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to accept invitation');
      }

      setSuccessMessage(`Successfully joined ${teamName}! The competition is now visible on your dashboard.`);
      await fetchInvitations();

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      alert(err.message || 'Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitationId: number) => {
    if (!confirm('Are you sure you want to reject this invitation?')) {
      return;
    }

    try {
      setProcessingId(invitationId);
      setSuccessMessage("");

      const response = await fetch(`http://localhost:4000/api/team-members/reject/${invitationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reject invitation');
      }

      await fetchInvitations();
    } catch (err: any) {
      console.error('Error rejecting invitation:', err);
      alert(err.message || 'Failed to reject invitation');
    } finally {
      setProcessingId(null);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Mail className="h-10 w-10 text-primary" />
              Team Invitations
            </h1>
            <p className="text-muted-foreground">
              Manage your pending team invitations
            </p>
          </div>

          {successMessage && (
            <Alert className="mb-6 border-green-500/50 bg-green-500/10">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {invitations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Mail className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No pending invitations</h3>
                <p className="text-muted-foreground text-center mb-2">
                  You don't have any team invitations at the moment.
                </p>
                {successMessage && (
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Check your dashboard to see your registered competitions!
                  </p>
                )}
                <Link to="/dashboard">
                  <Button className="mt-6">Go to Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <Card key={invitation.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 mb-2">
                          <Users2 className="h-5 w-5 text-primary" />
                          {invitation.team_name}
                        </CardTitle>
                        <CardDescription className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            <span>Competition: {invitation.event_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>Invited by: {invitation.invited_by_name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            Received: {new Date(invitation.joined_at).toLocaleDateString()}
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(invitation.id, invitation.team_name)}
                          disabled={processingId === invitation.id}
                        >
                          {processingId === invitation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(invitation.id)}
                          disabled={processingId === invitation.id}
                        >
                          {processingId === invitation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Invitations;