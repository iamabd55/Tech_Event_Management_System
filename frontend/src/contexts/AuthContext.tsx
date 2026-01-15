import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  userRole: 'user' | 'admin' | null;
  userName: string;
  loading: boolean;
  login: (token: string, role: 'user' | 'admin', name: string, email?: string) => void;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true); // Add loading state

  const checkAuth = () => {
    setLoading(true); // Start loading
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name') || localStorage.getItem('email');

    if (token && role) {
      setIsLoggedIn(true);
      setUserRole(role as 'user' | 'admin');
      setUserName(name || '');
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      setUserName("");
    }
    setLoading(false); // End loading
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (token: string, role: 'user' | 'admin', name: string, email?: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('name', name);
    if (email) {
      localStorage.setItem('email', email);
    }
    setIsLoggedIn(true);
    setUserRole(role);
    setUserName(name);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    setIsLoggedIn(false);
    setUserRole(null);
    setUserName("");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userRole, userName, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};