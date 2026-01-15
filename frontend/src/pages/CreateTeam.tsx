import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { teamsAPI, eventsAPI, Event } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CreateTeam = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userName,loading: authLoading } = useAuth();
  const [competitions, setCompetitions] = useState<Event[]>([]);
  const [formData, setFormData] = useState({
    teamName: "",
    competitionId: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetchingCompetitions, setFetchingCompetitions] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
     if (authLoading) return;
    // Check if user is authenticated
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    fetchCompetitions();
  }, [isLoggedIn, navigate]);

  const fetchCompetitions = async () => {
    try {
      setFetchingCompetitions(true);
      const data = await eventsAPI.getAll();
      
      // Filter only OPEN competitions
      const openCompetitions = data.filter((comp: any) => 
        comp.registration_status === 'open'
      );
      
      console.log('Open competitions:', openCompetitions);
      setCompetitions(openCompetitions);
    } catch (err: any) {
      console.error('Error fetching competitions:', err);
      setError('Failed to load competitions');
    } finally {
      setFetchingCompetitions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!formData.teamName.trim()) {
      setError("Please enter a team name");
      return;
    }

    if (!formData.competitionId) {
      setError("Please select a competition");
      return;
    }

    // Get current user's ID from localStorage
    const userDataString = localStorage.getItem('user');
    const userData = userDataString ? JSON.parse(userDataString) : null;
    
    if (!userData?.id) {
      setError("User information not found. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      // Create team via API (backend will check for duplicates)
      const newTeam = await teamsAPI.create({
        name: formData.teamName,
        event_id: parseInt(formData.competitionId),
        captain_id: userData.id,
      });

      console.log("Team created successfully:", newTeam);
      setSuccess(true);

      // Reset form
      setFormData({
        teamName: "",
        competitionId: "",
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error('Error creating team:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to create team';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingCompetitions) {
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
        <div className="max-w-2xl mx-auto">
          <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users2 className="h-8 w-8 text-primary" />
                Create Team
              </CardTitle>
              <CardDescription>Form a team to participate in competitions</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-6 bg-green-50 text-green-900 border-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Team created successfully! Redirecting to dashboard...
                  </AlertDescription>
                </Alert>
              )}

              {competitions.length === 0 && !fetchingCompetitions && (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No open competitions available at the moment. Check back later!
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    type="text"
                    placeholder="Enter your team name"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    required
                    disabled={loading || success}
                  />
                  <p className="text-sm text-muted-foreground">
                    Team names must be unique for each competition
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leader">Team Leader</Label>
                  <Input
                    id="leader"
                    type="text"
                    value={userName || "Current User (You)"}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">You will be automatically set as the team leader</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competition">Select Competition</Label>
                  <Select
                    value={formData.competitionId}
                    onValueChange={(value) => setFormData({ ...formData, competitionId: value })}
                    disabled={loading || success || competitions.length === 0}
                  >
                    <SelectTrigger id="competition">
                      <SelectValue placeholder="Choose a competition" />
                    </SelectTrigger>
                    <SelectContent>
                      {competitions.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No open competitions available
                        </SelectItem>
                      ) : (
                        competitions.map((comp) => (
                          <SelectItem key={comp.id} value={comp.id.toString()}>
                            {(comp as any).title || comp.name || 'Unnamed Competition'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {competitions.length > 0 
                      ? 'You can only create one team per competition' 
                      : 'No open competitions available'}
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg" 
                  disabled={loading || success || competitions.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Team...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Team Created!
                    </>
                  ) : (
                    'Create Team'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateTeam;