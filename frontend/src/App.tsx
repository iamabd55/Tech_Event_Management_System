import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Competitions from "./pages/Competitions";
import CompetitionDetails from "./pages/CompetitionDetails";
import Schedule from "./pages/Schedule";
import CreateTeam from "./pages/CreateTeam";
import TeamDetails from "./pages/TeamDetails";
import Admin from "./pages/Admin";
import ManageParticipants from "./pages/admin/ManageParticipants";
import ManageCompetitions from "./pages/admin/ManageCompetitions";
import ManageTeams from "./pages/admin/ManageTeams";
import ManageTeamMembers from "./pages/admin/ManageTeamMembers";
import ManageSchedules from "./pages/admin/ManageSchedules";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import Invitations from "./pages/Invitations";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/invitations" element={<Invitations />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/competition/:id" element={<CompetitionDetails />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/create-team" element={<CreateTeam />} />
          <Route path="/team/:id" element={<TeamDetails />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/participants" element={<ManageParticipants />} />
          <Route path="/admin/competitions" element={<ManageCompetitions />} />
          <Route path="/admin/teams" element={<ManageTeams />} />
          <Route path="/admin/team-members" element={<ManageTeamMembers />} />
          <Route path="/admin/schedules" element={<ManageSchedules />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;