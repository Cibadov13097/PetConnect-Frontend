import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Heart } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setAuth } = useAuth();

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    const response = await apiClient.login({ email, password });

    console.log('Login response:', response);

    // Try different possible token property names:
    const token = response.token ?? response.accessToken ?? null;

    if (response.success && token) {
      // Set token in ApiClient instance
      apiClient.setToken(token);

      // Persist token in localStorage for page reloads
      localStorage.setItem("authToken", token);

      // Update auth context/state (adjust depending on your user data shape)
      setAuth(response.user, token);

      toast({ title: "Success", description: "Logged in successfully!" });

      navigate("/");
    } else {
      console.warn('Login did not return a valid token or success flag.');
      toast({ title: "Error", description: "Login failed. Invalid credentials or no token received." });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    toast({ title: "Error", description: error.message || "Login failed.", variant: "destructive" });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Heart className="h-12 w-12 mx-auto text-white mb-4" />
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-white/80">Sign in to your Critter Connections account</p>
        </div>

        <Card className="shadow-warm border-0">
          <CardHeader className="text-center">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
