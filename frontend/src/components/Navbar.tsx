import { Button } from "@/components/ui/button";
import { Calendar, Menu, X, Shield, User, LogOut, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [invitationCount, setInvitationCount] = useState(0);
  const { isLoggedIn, userRole, userName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current path is dashboard
  const isDashboard = location.pathname === '/dashboard';

  // Fetch invitation count for logged-in users
  useEffect(() => {
    const fetchInvitationCount = async () => {
      if (!isLoggedIn || userRole === 'admin') return;
      
      try {
        const response = await fetch('http://localhost:4000/api/team-members/my-invitations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setInvitationCount(data.length);
        }
      } catch (error) {
        console.error('Error fetching invitation count:', error);
      }
    };

    fetchInvitationCount();
    
    // Poll for new invitations every 30 seconds
    if (isLoggedIn && userRole !== 'admin') {
      const interval = setInterval(fetchInvitationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, userRole]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    setInvitationCount(0);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              Tech Events
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Only show Home if NOT on dashboard */}
            {!isDashboard && (
              <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors">
                Home
              </Link>
            )}
            <Link to="/competitions" className="text-foreground/80 hover:text-foreground transition-colors">
              Competitions
            </Link>
            <Link to="/schedule" className="text-foreground/80 hover:text-foreground transition-colors">
              Schedule
            </Link>
            
            <div className="flex items-center space-x-4">
              {!isLoggedIn ? (
                // Not logged in - show login and register
                <>
                  <Link to="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button>Register</Button>
                  </Link>
                  <Link to="/admin-login">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                </>
              ) : userRole === 'admin' ? (
                // Logged in as Admin
                <>
                  <Link to="/admin">
                    <Button variant="outline" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="ghost" className="gap-2">
                      <User className="h-4 w-4" />
                      Login as User
                    </Button>
                  </Link>
                  <Button variant="destructive" onClick={handleLogout} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                // Logged in as User
                <>
                  <Link to="/invitations" className="relative">
                    <Button variant="ghost" size="icon" className="relative">
                      <Mail className="h-5 w-5" />
                      {invitationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                          {invitationCount > 9 ? '9+' : invitationCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="ghost" className="gap-2">
                      <User className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    Welcome, <span className="font-medium text-foreground">{userName}</span>
                  </span>
                  <Link to="/admin-login">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                  <Button variant="destructive" onClick={handleLogout} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4">
            {/* Only show Home if NOT on dashboard */}
            {!isDashboard && (
              <Link
                to="/"
                className="block text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
            )}
            <Link
              to="/competitions"
              className="block text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Competitions
            </Link>
            <Link
              to="/schedule"
              className="block text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Schedule
            </Link>
            
            <div className="flex flex-col space-y-2 pt-4 border-t border-border">
              {!isLoggedIn ? (
                // Not logged in
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)}>
                    <Button className="w-full">Register</Button>
                  </Link>
                  <Link to="/admin-login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full gap-2">
                      <Shield className="h-4 w-4" />
                      Admin Login
                    </Button>
                  </Link>
                </>
              ) : userRole === 'admin' ? (
                // Logged in as Admin
                <>
                  <Link to="/admin" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full gap-2">
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Button>
                  </Link>
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full gap-2">
                      <User className="h-4 w-4" />
                      Login as User
                    </Button>
                  </Link>
                  <Button variant="destructive" onClick={handleLogout} className="w-full gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                // Logged in as User
                <>
                  <Link to="/invitations" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full gap-2 relative">
                      <Mail className="h-4 w-4" />
                      Invitations
                      {invitationCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                          {invitationCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full gap-2">
                      <User className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <div className="text-sm text-muted-foreground px-4 py-2">
                    Welcome, <span className="font-medium text-foreground">{userName}</span>
                  </div>
                  <Link to="/admin-login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                  <Button variant="destructive" onClick={handleLogout} className="w-full gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;