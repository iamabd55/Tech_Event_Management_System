import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Trash2, Loader2, Users, Mail, Phone, Calendar, Trophy, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import axios from "axios";

const API_URL = 'http://localhost:4000/api';

interface Participant {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  created_at: string;
  competitions?: string;
}

const ManageParticipants = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setParticipants(response.data);
    } catch (err: any) {
      console.error('Error fetching participants:', err);
      if (err.response?.status === 401) {
        setError('Unauthorized. Please log in as an admin.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError(err.response?.data?.message || 'Failed to load participants');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will also remove them from all teams. This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setParticipants(participants.filter(p => p.id !== id));
      alert('Participant deleted successfully');
    } catch (err: any) {
      console.error('Error deleting participant:', err);
      alert(err.response?.data?.message || 'Failed to delete participant');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseCompetitions = (competitionsString?: string): string[] => {
    if (!competitionsString) return [];
    return competitionsString.split('|').filter(Boolean);
  };

  const filteredParticipants = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.competitions?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const totalParticipants = participants.length;
  const participantsWithTeams = participants.filter(p => p.competitions).length;
  const participantsWithoutTeams = totalParticipants - participantsWithTeams;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-24">
        <div className="flex items-center justify-between mb-6">
          <Link to="/admin" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Link>
          <Button 
            onClick={fetchParticipants} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Manage Participants</h1>
          </div>
          <p className="text-muted-foreground mb-6">View and manage registered users and their competition enrollments</p>
          
          {/* Statistics Cards */}
          {!loading && !error && participants.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Participants</span>
                </div>
                <p className="text-2xl font-bold">{totalParticipants}</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">In Competitions</span>
                </div>
                <p className="text-2xl font-bold">{participantsWithTeams}</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Not Enrolled</span>
                </div>
                <p className="text-2xl font-bold">{participantsWithoutTeams}</p>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, or competition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
            <p className="font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/90">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading participants...</p>
          </div>
        ) : (
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Competitions</TableHead>
                    <TableHead>Registered At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">
                          {searchQuery ? "No participants match your search" : "No participants found"}
                        </p>
                        {searchQuery && (
                          <p className="text-sm mt-1">Try adjusting your search query</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParticipants.map((participant, index) => {
                      const competitions = parseCompetitions(participant.competitions);
                      return (
                        <TableRow key={participant.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium">{participant.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{participant.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {participant.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{participant.phone}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {competitions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {competitions.map((comp, idx) => (
                                  <span 
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-medium"
                                  >
                                    <Trophy className="h-3 w-3" />
                                    {comp}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm italic">Not enrolled</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(participant.created_at)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDelete(participant.id, participant.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Results Summary */}
            {!loading && !error && filteredParticipants.length > 0 && (
              <div className="px-4 py-3 border-t bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{filteredParticipants.length}</span> of <span className="font-medium text-foreground">{totalParticipants}</span> participants
                  {searchQuery && " (filtered)"}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageParticipants;