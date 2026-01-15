import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Trophy, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";

interface Event {
  id: number;
  title: string;
  start_datetime: string;
  end_datetime: string;
  venue: string;
}

const Schedule = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/events');
      
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }
      
      const data = await response.json();
      
      // Sort by start_datetime
      const sortedEvents = data.sort((a: Event, b: Event) => 
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      );
      
      setEvents(sortedEvents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-6 py-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Schedule</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={fetchSchedule}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <Calendar className="h-10 w-10 text-primary" />
            Event Schedule
          </h1>
          <p className="text-xl text-muted-foreground">
            View all upcoming competition dates and timings
          </p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No events scheduled at the moment.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {events.map((event) => (
              <Card key={event.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium mb-1">Start Time</div>
                        <div className="text-muted-foreground">
                          {formatDateTime(event.start_datetime)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium mb-1">End Time</div>
                        <div className="text-muted-foreground">
                          {formatDateTime(event.end_datetime)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium mb-1">Location</div>
                        <div className="text-muted-foreground">{event.venue}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Schedule;