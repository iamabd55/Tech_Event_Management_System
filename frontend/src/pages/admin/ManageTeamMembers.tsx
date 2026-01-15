import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Loader2, Users2, Mail, Phone, Trophy, Shield, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import axios from "axios";

const API_URL = 'http://localhost:4000/api';

interface TeamMemberOverview {
  name: string;
  email: string;
  phone: string;
  TeamName: string;
  role: string;
  EventTitle: string;
}

const ManageTeamMembers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<TeamMemberOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/admin/team-members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMembers(response.data);
    } catch (err: any) {
      console.error('Error fetching team members:', err);
      if (err.response?.status === 401) {
        setError('Unauthorized. Please log in as an admin.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError(err.response?.data?.message || 'Failed to load team members');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.TeamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.EventTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get statistics
  const totalMembers = members.length;
  const totalLeaders = members.filter(m => m.role === 'Leader').length;
  const totalTeams = new Set(members.map(m => m.TeamName)).size;
  const totalEvents = new Set(members.map(m => m.EventTitle)).size;

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
            onClick={fetchMembers} 
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
            <Users2 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Team Members Overview</h1>
          </div>
          <p className="text-muted-foreground mb-6">View and manage all team members across all competitions</p>
          
          {/* Statistics Cards */}
          {!loading && !error && members.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Members</span>
                </div>
                <p className="text-2xl font-bold">{totalMembers}</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Team Leaders</span>
                </div>
                <p className="text-2xl font-bold">{totalLeaders}</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Teams</span>
                </div>
                <p className="text-2xl font-bold">{totalTeams}</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Active Events</span>
                </div>
                <p className="text-2xl font-bold">{totalEvents}</p>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, team, role, or event..."
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
            <p className="text-muted-foreground">Loading team members...</p>
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
                    <TableHead>Team Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Event Title</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        <Users2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">
                          {searchQuery ? "No members match your search" : members.length === 0 ? "No team members found" : "No results"}
                        </p>
                        {searchQuery && (
                          <p className="text-sm mt-1">Try adjusting your search query</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member, index) => (
                      <TableRow key={`${member.email}-${index}`} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{member.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{member.phone}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{member.TeamName}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            member.role === 'Leader' 
                              ? 'bg-primary/10 text-primary border border-primary/20' 
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}>
                            {member.role === 'Leader' && <Shield className="h-3 w-3" />}
                            {member.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Trophy className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{member.EventTitle}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Results Summary */}
            {!loading && !error && filteredMembers.length > 0 && (
              <div className="px-4 py-3 border-t bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{filteredMembers.length}</span> of <span className="font-medium text-foreground">{totalMembers}</span> members
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

export default ManageTeamMembers;