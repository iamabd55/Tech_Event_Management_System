import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
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

const ManageCompetitions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [saving, setSaving] = useState(false);

  // Empty competition template for adding new ones
  const emptyCompetition = {
    id: 0,
    title: '',
    description: '',
    venue: '',
    start_datetime: '',
    end_datetime: '',
    capacity: 0,
    registration_status: 'open',
    rules: '',
    created_at: ''
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure null values are converted to empty strings
      const competitions = response.data.map((comp: Competition) => ({
        ...comp,
        rules: comp.rules || '',
        description: comp.description || '',
        venue: comp.venue || ''
      }));
      
      setCompetitions(competitions);
      setError("");
    } catch (err: any) {
      console.error('Error fetching competitions:', err);
      setError(err.response?.data?.message || 'Failed to load competitions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCompetitions(competitions.filter(c => c.id !== id));
      alert('Competition deleted successfully');
    } catch (err: any) {
      console.error('Error deleting competition:', err);
      alert(err.response?.data?.message || 'Failed to delete competition');
    }
  };

  const handleEdit = (competition: Competition) => {
    setDialogMode('edit');
    setEditingCompetition({ ...competition });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setDialogMode('add');
    setEditingCompetition({ ...emptyCompetition });
    setIsDialogOpen(true);
  };

  const toMySQLDateTime = (isoString: string) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleSave = async () => {
    if (!editingCompetition) return;

    if (!editingCompetition.title.trim()) {
      alert('Title is required');
      return;
    }

    if (!editingCompetition.start_datetime) {
      alert('Start date is required');
      return;
    }

    // Validate dates
    const startDate = new Date(editingCompetition.start_datetime);
    const endDate = editingCompetition.end_datetime ? new Date(editingCompetition.end_datetime) : null;
    
    if (isNaN(startDate.getTime())) {
      alert('Invalid start date');
      return;
    }

    if (endDate && !isNaN(endDate.getTime()) && endDate < startDate) {
      alert('End date cannot be before start date');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const payload = {
        title: editingCompetition.title.trim(),
        description: editingCompetition.description?.trim() || '',
        venue: editingCompetition.venue?.trim() || '',
        start_datetime: toMySQLDateTime(editingCompetition.start_datetime),
        end_datetime: editingCompetition.end_datetime ? toMySQLDateTime(editingCompetition.end_datetime) : null,
        capacity: Number(editingCompetition.capacity) || 0,
        registration_status: editingCompetition.registration_status,
        rules: editingCompetition.rules?.trim() || '',
      };

      if (dialogMode === 'add') {
        // Create new competition
        const response = await axios.post(
          `${API_URL}/events`,
          payload,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Refresh the list to get the new competition
        await fetchCompetitions();
        alert('Competition created successfully');
      } else {
        // Update existing competition
        const response = await axios.put(
          `${API_URL}/events/${editingCompetition.id}`,
          payload,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setCompetitions(
          competitions.map(c =>
            c.id === editingCompetition.id ? response.data : c
          )
        );
        alert('Competition updated successfully');
      }

      setIsDialogOpen(false);
      setEditingCompetition(null);
    } catch (err: any) {
      console.error('Full error:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message ||
                          `Failed to ${dialogMode === 'add' ? 'create' : 'update'} competition`;
      alert(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTimeForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  const getStatus = (startDate: string, endDate: string, registrationStatus: string) => {
    if (registrationStatus === 'closed') return 'Closed';
    
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    // If event hasn't started yet
    if (start > now) {
      return 'Upcoming';
    }
    
    // If event has an end date and it's passed
    if (end && end < now) {
      return 'Completed';
    }
    
    // If event has started but no end date, or end date is in future
    if (!end || end > now) {
      return 'Ongoing';
    }
    
    return 'Completed';
  };

  const filteredCompetitions = competitions.filter(
    (c) =>
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.venue && c.venue.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-24">
        <Link to="/admin" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Manage Competitions</h1>
          <p className="text-muted-foreground mb-4">Create and manage competition events</p>
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search competitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Competition
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompetitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {searchQuery ? "No competitions match your search" : "No competitions found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompetitions.map((competition, index) => {
                    const status = getStatus(competition.start_datetime, competition.end_datetime, competition.registration_status);
                    return (
                      <TableRow key={competition.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{competition.title}</TableCell>
                        <TableCell className="max-w-xs truncate">{competition.description || 'N/A'}</TableCell>
                        <TableCell>{competition.venue || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{formatDateTime(competition.start_datetime)}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              status === "Upcoming"
                                ? "bg-blue-500/10 text-blue-500"
                                : status === "Ongoing"
                                ? "bg-green-500/10 text-green-500"
                                : status === "Closed"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(competition)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDelete(competition.id, competition.title)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'add' ? 'Add New Competition' : 'Edit Competition'}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'add' ? 'Create a new competition event' : 'Update the competition details below'}
            </DialogDescription>
          </DialogHeader>

          {editingCompetition && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={editingCompetition.title}
                  onChange={(e) => setEditingCompetition({
                    ...editingCompetition,
                    title: e.target.value
                  })}
                  placeholder="Competition title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingCompetition.description || ''}
                  onChange={(e) => setEditingCompetition({
                    ...editingCompetition,
                    description: e.target.value
                  })}
                  placeholder="Competition description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={editingCompetition.venue || ''}
                  onChange={(e) => setEditingCompetition({
                    ...editingCompetition,
                    venue: e.target.value
                  })}
                  placeholder="Event venue"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_datetime">Start Date & Time *</Label>
                  <Input
                    id="start_datetime"
                    type="datetime-local"
                    value={formatDateTimeForInput(editingCompetition.start_datetime)}
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value);
                        setEditingCompetition({
                          ...editingCompetition,
                          start_datetime: date.toISOString(),
                        });
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_datetime">End Date & Time</Label>
                  <Input
                    id="end_datetime"
                    type="datetime-local"
                    value={formatDateTimeForInput(editingCompetition.end_datetime)}
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value);
                        setEditingCompetition({
                          ...editingCompetition,
                          end_datetime: date.toISOString(),
                        });
                      } else {
                        setEditingCompetition({
                          ...editingCompetition,
                          end_datetime: '',
                        });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    value={editingCompetition.capacity}
                    onChange={(e) => setEditingCompetition({
                      ...editingCompetition,
                      capacity: parseInt(e.target.value) || 0
                    })}
                    placeholder="Maximum participants"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_status">Registration Status</Label>
                  <Select
                    value={editingCompetition.registration_status}
                    onValueChange={(value) => setEditingCompetition({
                      ...editingCompetition,
                      registration_status: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules">Competition Rules</Label>
                <Textarea
                  id="rules"
                  value={editingCompetition.rules ?? ''}
                  onChange={(e) => setEditingCompetition({
                    ...editingCompetition,
                    rules: e.target.value
                  })}
                  placeholder="Enter competition rules and guidelines"
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Enter each rule on a new line. Markdown formatting is supported.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingCompetition(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !editingCompetition?.title}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {dialogMode === 'add' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                dialogMode === 'add' ? 'Create Competition' : 'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageCompetitions;