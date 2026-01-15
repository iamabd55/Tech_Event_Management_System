import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "@/services/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // Get login function from context
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      // Call backend API
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      console.log("Login successful:", response);
      console.log('=== DEBUG START ===');
      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('User:', response.user);
      console.log('User role:', response.user?.role);
      console.log('=== DEBUG END ===');

      // Check if user is admin
      const userRole = response.user?.role;
      
      if (userRole !== 'admin') {
        setError("Access denied. Admin credentials required.");
        // Clear any stored data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        localStorage.removeItem('email');
        setLoading(false);
        return;
      }

      // Store token and user data using context
      if (response.token && response.user) {
        const userName = response.user.name || response.user.email;
        
        // Use context login function with 'admin' role
        login(response.token, 'admin', userName, response.user.email);
        
        // Also store full user object for backward compatibility
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      // Redirect to admin dashboard
      navigate("/admin");
    } catch (err: any) {
      // Handle error
      console.error("Login error:", err);
      console.error("Response data:", err.response?.data);
      console.error("Status code:", err.response?.status);

      const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-primary/50">
        <CardHeader>
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-3xl">Admin Login</CardTitle>
          </div>
          <CardDescription>Restricted access for administrators only</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Verifying..." : "Login as Admin"}
            </Button>

            <div className="pt-4 border-t">
              <p className="text-center text-sm text-muted-foreground">
                Regular user?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;