// frontend/src/services/api.ts
import axios from 'axios';

// Base API URL - change this to match your backend
const API_URL = 'http://localhost:4000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =======================
// Types
// =======================

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: User;
}

// =======================
// Auth API Calls
// =======================

export const authAPI = {
  // Register new user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Check if user is logged in
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // Get stored user data
  getUser: (): User | null => {
    const user = localStorage.getItem('user');
    // Check if user exists and is valid JSON
    if (!user || user === "undefined" || user === "null") {
      return null;
    }
    try {
      return JSON.parse(user);
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem('user'); // Clean up invalid data
      return null;
    }
  },

  // Update profile
  updateProfile: async (data: { name: string; phone: string }): Promise<AuthResponse> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<AuthResponse> => {
    const response = await api.put('/auth/password', data);
    return response.data;
  },
};

// =======================
// Events API Calls
// =======================

export interface Event {
  id: number;
  title: string; 		   // Database field
  name?: string; 		   // Legacy support
  description: string;
  venue: string; 		   // Database field
  location?: string; 	   // Legacy support
  start_datetime: string;  // Database field
  end_datetime: string; 	   // Database field
  event_date?: string; 	   // Legacy support
  capacity: number;
  category_id?: number;
  registration_status: 'open' | 'closed';
  rules?: string;
  created_by?: number;
  max_teams?: number; 	   // Legacy support
  created_at: string;
  updated_at?: string;
}

export const eventsAPI = {
  getAll: async (): Promise<Event[]> => {
    const response = await api.get('/events');
    return response.data;
  },

  getById: async (id: number): Promise<Event> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  create: async (eventData: Partial<Event>): Promise<Event> => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  update: async (id: number, eventData: Partial<Event>): Promise<Event> => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/events/${id}`);
  },
};

// =======================
// Teams API Calls
// =======================

export interface Team {
  id: number;
  name: string;
  event_id: number;
  captain_id: number;
  captain_name?: string;
  created_at: string;
}

export const teamsAPI = {
  getAll: async (): Promise<Team[]> => {
    const response = await api.get('/teams');
    return response.data;
  },

  getById: async (id: number): Promise<Team> => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  getByEvent: async (eventId: number): Promise<Team[]> => {
    const response = await api.get(`/teams/event/${eventId}`);
    return response.data;
  },

  create: async (teamData: Partial<Team>): Promise<Team> => {
    const response = await api.post('/teams', teamData);
    return response.data;
  },

  update: async (id: number, teamData: Partial<Team>): Promise<Team> => {
    const response = await api.put(`/teams/${id}`, teamData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/teams/${id}`);
  },
};

// =======================
// Registrations API Calls
// =======================

export interface Registration {
  id: number;
  user_id: number;
  event_id: number;
  team_id?: number;
  created_at: string;
}

export const registrationsAPI = {
  register: async (registrationData: Partial<Registration>): Promise<Registration> => {
    const response = await api.post('/registrations', registrationData);
    return response.data;
  },

  getMyRegistrations: async (): Promise<Registration[]> => {
    const response = await api.get('/registrations/my');
    return response.data;
  },

  cancel: async (id: number): Promise<void> => {
    await api.delete(`/registrations/${id}`);
  },
};

// =======================
// Team Members API
// =======================

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  invited_by?: number;
  invited_by_name?: string;
  joined_at: string;
}

export interface TeamInvitation {
  id: number;
  team_id: number;
  team_name: string;
  event_name: string;
  invited_by_name: string;
  status: string;
  joined_at: string;
}

// 💡 NEW INTERFACE for the expected payload from /team-members/my-teams
export interface UserTeamRegistration {
  id: number; // Represents the team_member ID
  team_id: number;
  team_name: string;
  event_id: number; // Required to link back to the full Event object
  event_date: string; 
  location: string;
  captain_id: number; // Required for role check
}

export const teamMembersAPI = {
  getTeamMembers: async (teamId: number): Promise<TeamMember[]> => {
    const response = await api.get(`/team-members/team/${teamId}`);
    return response.data;
  },

  getMyInvitations: async (): Promise<TeamInvitation[]> => {
    const response = await api.get('/team-members/my-invitations');
    return response.data;
  },

  // 💡 NEW API FUNCTION ADDED TO FIX THE DASHBOARD ISSUE
  getMyTeams: async (): Promise<UserTeamRegistration[]> => {
    const response = await api.get('/team-members/my-teams');
    return response.data;
  },

  inviteMember: async (teamId: number, userEmail: string) => {
    const response = await api.post('/team-members/invite', { team_id: teamId, user_email: userEmail });
    return response.data;
  },

  acceptInvitation: async (invitationId: number) => {
    const response = await api.put(`/team-members/accept/${invitationId}`);
    return response.data;
  },

  rejectInvitation: async (invitationId: number) => {
    const response = await api.put(`/team-members/reject/${invitationId}`);
    return response.data;
  },

  removeMember: async (memberId: number) => {
    const response = await api.delete(`/team-members/${memberId}`);
    return response.data;
  },

  leaveTeam: async (teamId: number) => {
    const response = await api.delete(`/team-members/leave/${teamId}`);
    return response.data;
  },
};

export default api;