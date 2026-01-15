import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, MapPin, Trophy, Users2, Loader2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { eventsAPI, registrationsAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Schedule {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
}

interface Competition {
  id: number;
  title: string;
  description: string;
  rules: string;
  registration_status: "open" | "closed";
  venue: string;
  start_datetime: string;
  end_datetime: string;
  capacity: number;
  category_name?: string;
  category_icon?: string;
  organizer_name?: string;
}

const CompetitionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [registering, setRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false); // NEW

  useEffect(() => {
    if (id) {
      fetchCompetitionDetails();
      fetchRegistered(); // NEW
    }
  }, [id]);

  // -----------------------------
  // 🔥 Fetch user registrations
  // -----------------------------
  const fetchRegistered = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:4000/api/registrations/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      const eventIds = data.map((r: any) => r.event_id);

      setAlreadyRegistered(eventIds.includes(parseInt(id!))); // NEW
    } catch (err) {
      console.error("Error loading registered events:", err);
    }
  };

  // -----------------------------
  // 🔥 Fetch competition details
  // -----------------------------
  const fetchCompetitionDetails = async () => {
    try {
      setLoading(true);

      const data = await eventsAPI.getById(parseInt(id!));
      setCompetition(data as any);

      try {
        const scheduleResponse = await fetch(`http://localhost:4000/api/events/${id}/schedule`);
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          setSchedule(scheduleData);
        }
      } catch (err) {
        console.log("No schedule available");
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching competition details:", err);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 🔥 Handle Registration
  // -----------------------------
  const handleRegister = async () => {
    if (!isLoggedIn) {
      alert("Please log in to register");
      navigate("/login");
      return;
    }

    if (!competition || competition.registration_status === "closed") {
      alert("Registration is closed");
      return;
    }

    if (alreadyRegistered) {
      alert("You are already registered for this event");
      return;
    }

    try {
      setRegistering(true);

      await registrationsAPI.register({
        event_id: competition.id,
      });

      setAlreadyRegistered(true);
      setRegistrationSuccess(true);
      alert("Successfully registered!");
    } catch (err: any) {
      if (err.response?.status === 409) {
        setAlreadyRegistered(true);
        alert("Already registered");
      } else {
        alert(err.response?.data?.message || "Registration failed");
      }
    } finally {
      setRegistering(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  // -----------------------------
  // 🔥 Loading state
  // -----------------------------
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

  // -----------------------------
  // ❌ Error state
  // -----------------------------
  if (error || !competition) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-6 py-24">
          <Link to="/competitions" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Competitions
          </Link>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Competition not found"}</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-24">
        <Link to="/competitions" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Competitions
        </Link>

        <div className="mb-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            {competition.category_icon && <span className="text-3xl">{competition.category_icon}</span>}
            {competition.category_name && (
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {competition.category_name}
              </span>
            )}
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold mb-4 flex items-center gap-3">
            <Trophy className="h-10 w-10 text-primary" />
            {competition.title}
          </h1>

          {/* Event Info */}
          <div className="flex flex-wrap gap-4 mb-6 text-muted-foreground">
            {competition.start_datetime && (
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDateTime(competition.start_datetime)}
              </span>
            )}
            {competition.venue && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {competition.venue}
              </span>
            )}
            {competition.capacity && (
              <span className="flex items-center gap-2">
                <Users2 className="h-4 w-4" />
                Capacity: {competition.capacity}
              </span>
            )}
          </div>

          {/* Success Message */}
          {alreadyRegistered && (
            <Alert className="mb-6 bg-green-50 text-green-900 border-green-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>You are already registered for this competition!</AlertDescription>
            </Alert>
          )}

          {/* Register Button */}
          <div className="flex gap-4 mb-6">
            <Button
              size="lg"
              disabled={
                registering ||
                competition.registration_status === "closed" ||
                alreadyRegistered ||
                registrationSuccess
              }
              onClick={handleRegister}
            >
              {registering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : alreadyRegistered ? (
                "Already Registered"
              ) : competition.registration_status === "closed" ? (
                "Registration Closed"
              ) : (
                "Register for Competition"
              )}
            </Button>

            <Link to="/create-team">
              <Button variant="outline" size="lg">
                <Users2 className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </Link>
          </div>
        </div>

        {/* Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About This Competition</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {competition.description}
            </p>
          </CardContent>
        </Card>

        {/* Rules */}
        {competition.rules && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Rules & Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-muted-foreground whitespace-pre-wrap font-sans">{competition.rules}</pre>
            </CardContent>
          </Card>
        )}

        {/* Schedule */}
        {schedule.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Event Schedule
              </CardTitle>
              <CardDescription>Timeline for all competition activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedule.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDateTime(item.start_time)} — {new Date(item.end_time).toLocaleTimeString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {item.location}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fallback Timeline */}
        {schedule.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Event Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold">Event Start</h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDateTime(competition.start_datetime)}
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold">Event End</h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDateTime(competition.end_datetime)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default CompetitionDetails;
