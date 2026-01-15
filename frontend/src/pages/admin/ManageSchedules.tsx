import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, Pencil, Trash2, Plus, Loader2, AlertCircle, ArrowUpDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { eventsAPI, Event } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Schedule {
  id: number;
  title: string;
  start_datetime: string;
  end_datetime: string;
  venue: string;
  description?: string;
  registration_status: 'open' | 'closed';
}

type SortOption = 'latest' | 'oldest' | 'alphabetical' | 'open-first' | 'closed-first';

const ManageSchedules = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const { isLoggedIn, userRole, loading: authLoading } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    start_datetime: "",
    end_datetime: "",
    venue: "",
    description: "",
    registration_status: "open" as 'open' | 'closed'
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || userRole !== 'admin') {
      navigate("/login");
      return;
    }
    fetchSchedules();
  }, [isLoggedIn, userRole, navigate, sortBy]); // Re-fetch when sortBy changes

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch events with sort parameter from backend
      const response = await fetch(`http://localhost:4000/api/events?sortBy=${sortBy}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }
      
      const events = await response.json();
      
      const schedulesData = events.map((event: Event) => ({
        id: event.id,
        title: event.title || event.name || 'Untitled Event',
        start_datetime: event.start_datetime || event.event_date || '',
        end_datetime: event.end_datetime || event.event_date || '',
        venue: event.venue || event.location || 'TBD',
        description: event.description || '',
        registration_status: event.registration_status || 'open'
      }));
      
      setSchedules(schedulesData);
    } catch (error: any) {
      console.error("Error fetching schedules:", error);
      setError(error.message || "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const getSortedSchedules = (schedules: Schedule[]) => {
    // Sorting is now done by backend, just filter by search
    return schedules;
  };

  const filteredSchedules = getSortedSchedules(
    schedules.filter(
      (s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.venue.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const getSortLabel = () => {
    switch (sortBy) {
      case 'latest': return 'Latest First';
      case 'oldest': return 'Oldest First';
      case 'alphabetical': return 'A-Z';
      case 'open-first': return 'Open First';
      case 'closed-first': return 'Closed First';
      default: return 'Sort By';
    }
  };

  const handleOpenDialog = (schedule?: Schedule) => {
    if (schedule) {
      setIsEditMode(true);
      setCurrentSchedule(schedule);
      setFormData({
        title: schedule.title,
        start_datetime: schedule.start_datetime ? new Date(schedule.start_datetime).toISOString().slice(0, 16) : '',
        end_datetime: schedule.end_datetime ? new Date(schedule.end_datetime).toISOString().slice(0, 16) : '',
        venue: schedule.venue,
        description: schedule.description || '',
        registration_status: schedule.registration_status
      });
    } else {
      setIsEditMode(false);
      setCurrentSchedule(null);
      setFormData({
        title: "",
        start_datetime: "",
        end_datetime: "",
        venue: "",
        description: "",
        registration_status: "open"
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setCurrentSchedule(null);
    setFormData({
      title: "",
      start_datetime: "",
      end_datetime: "",
      venue: "",
      description: "",
      registration_status: "open"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.start_datetime || !formData.venue) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);
      
      const eventData = {
        title: formData.title,
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime || formData.start_datetime,
        venue: formData.venue,
        description: formData.description,
        registration_status: formData.registration_status,
        capacity: 100
      };

      if (isEditMode && currentSchedule) {
        await eventsAPI.update(currentSchedule.id, eventData);
        alert("Schedule updated successfully!");
      } else {
        await eventsAPI.create(eventData);
        alert("Schedule created successfully!");
      }
      
      handleCloseDialog();
      await fetchSchedules();
    } catch (error: any) {
      console.error("Error saving schedule:", error);
      alert(error.response?.data?.message || "Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this schedule?")) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteId(id);
      await eventsAPI.delete(id);
      alert("Schedule deleted successfully!");
      await fetchSchedules();
    } catch (error: any) {
      console.error("Error deleting schedule:", error);
      alert(error.response?.data?.message || "Failed to delete schedule");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
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
        <Link to="/admin" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Manage Schedules</h1>
          <p className="text-muted-foreground mb-4">
            Total Schedules: {schedules.length}
          </p>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search schedules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {getSortLabel()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('latest')}>
                  Latest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('alphabetical')}>
                  Alphabetical (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('open-first')}>
                  Open First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('closed-first')}>
                  Closed First
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Competition</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No schedules match your search' : 'No schedules found. Click "Add Schedule" to create one.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>{schedule.id}</TableCell>
                    <TableCell className="font-medium">{schedule.title}</TableCell>
                    <TableCell>
                      {schedule.start_datetime ? new Date(schedule.start_datetime).toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {schedule.end_datetime ? new Date(schedule.end_datetime).toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>{schedule.venue}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        schedule.registration_status === 'open' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {schedule.registration_status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenDialog(schedule)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(schedule.id)}
                          disabled={isDeleting && deleteId === schedule.id}
                        >
                          {isDeleting && deleteId === schedule.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Schedule' : 'Add New Schedule'}</DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Update the schedule details below.' : 'Create a new event schedule.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Competition Name *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Hackathon 2025"
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="start_datetime">Start Date & Time *</Label>
                  <Input
                    id="start_datetime"
                    type="datetime-local"
                    value={formData.start_datetime}
                    onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end_datetime">End Date & Time</Label>
                  <Input
                    id="end_datetime"
                    type="datetime-local"
                    value={formData.end_datetime}
                    onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="venue">Venue *</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g., Hall A, Room 301"
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    disabled={isSaving}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="registration_status">Registration Status</Label>
                  <select
                    id="registration_status"
                    value={formData.registration_status}
                    onChange={(e) => setFormData({ ...formData, registration_status: e.target.value as 'open' | 'closed' })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    disabled={isSaving}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{isEditMode ? 'Update' : 'Create'} Schedule</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ManageSchedules;