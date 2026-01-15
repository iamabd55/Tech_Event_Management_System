import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, MapPin, Users, Loader2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = 'http://localhost:4000/api';

interface Competition {
  id: number;
  title: string;
  description: string;
  venue: string;
  start_datetime: string;
  end_datetime: string;
  capacity: number;
  registration_status: string;
  rules: string;
  created_at: string;
}

const Competitions = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [registered, setRegistered] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCompetitions();
    fetchRegistered();
  }, []);

  // Fetch all competitions
  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/events`);
      setCompetitions(response.data);
      setError("");
    } catch (err: any) {
      console.error("Error fetching competitions:", err);
      setError("Failed to load competitions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's registered events
  const fetchRegistered = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_URL}/registrations/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const registeredEventIds = res.data.map((reg: any) => reg.event_id);
      setRegistered(registeredEventIds);
    } catch (err) {
      console.error("Error loading registered events:", err);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'TBA';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine status
  const getStatus = (startDate: string, registrationStatus: string) => {
    if (registrationStatus === 'closed') return 'Closed';
    const today = new Date();
    const event = new Date(startDate);
    return event > today ? 'Open' : 'Completed';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">Loading competitions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <Trophy className="h-10 w-10 text-primary" />
            All Competitions
          </h1>
          <p className="text-xl text-muted-foreground">
            Browse and register for tech competitions
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive flex items-center gap-2 max-w-2xl mx-auto">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {competitions.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Competitions Available</h2>
            <p className="text-muted-foreground">Check back later for upcoming events!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((comp) => {
              const status = getStatus(comp.start_datetime, comp.registration_status);
              const isOpen = status === 'Open';
              const alreadyRegistered = registered.includes(comp.id);

              return (
                <Card
                  key={comp.id}
                  className="hover:border-primary/50 transition-all hover:shadow-lg flex flex-col"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="flex items-center gap-2 flex-1">
                        <Trophy className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="line-clamp-2">{comp.title}</span>
                      </CardTitle>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          isOpen
                            ? "bg-primary/10 text-primary"
                            : status === "Closed"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <CardDescription className="min-h-[48px] line-clamp-2">
                      {comp.description || 'No description available'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    <div className="space-y-2 text-sm flex-1">
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{formatDate(comp.start_datetime)}</span>
                      </div>

                      {comp.venue && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{comp.venue}</span>
                        </div>
                      )}

                      {comp.capacity > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span>Capacity: {comp.capacity}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mt-auto">

                      {/* View Details Page */}
                      <Link to={`/competition/${comp.id}`} className="block">
                        <Button variant="outline" className="w-full">
                          View Details
                        </Button>
                      </Link>

                      {/* Registration Button Logic */}
                      {isOpen ? (
                        alreadyRegistered ? (
                          <Button className="w-full" disabled>
                            Already Registered
                          </Button>
                        ) : (
                          <Link to={`/competition/${comp.id}`} className="block">
                            <Button className="w-full">Register Now</Button>
                          </Link>
                        )
                      ) : (
                        <Button className="w-full" disabled>
                          Registration {status}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Competitions;
