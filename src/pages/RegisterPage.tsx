import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Heart } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = "699067952636-57qhgo14msm990l02drtr7hisbv9nql1.apps.googleusercontent.com";

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullname: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Member"
  });
  const [googleRole, setGoogleRole] = useState<string>("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google SDK scriptini əlavə et və initialize et
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = () => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleRegister,
            ux_mode: "popup",
            context: "signup",
          });
        }
      };
    } else {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleRegister,
          ux_mode: "popup",
          context: "signup",
        });
      }
    }
    // Google callback funksiyasını window-a əlavə et (SDK üçün lazımdır)
    (window as any).handleGoogleRegister = handleGoogleRegister;
    // eslint-disable-next-line
  }, [googleRole]);

  // Normal qeydiyyat
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match!", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        FullName: formData.fullname,
        UserName: formData.userName,
        Email: formData.email,
        Password: formData.password,
        ConfirmPassword: formData.confirmPassword,
        Role: formData.role,
      };
      await apiClient.register(payload);
      toast({ title: "Success", description: "Account created! Check your email." });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Registration failed.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Google qeydiyyat callback
  function handleGoogleRegister(response: any) {
    if (!googleRole) {
      setShowRoleModal(true);
      return;
    }
    setGoogleLoading(true);
    fetch("/api/Account/GoogleRegister", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: response.credential, userType: googleRole }),
    })
      .then(async res => {
        const data = await res.json();
        if (res.ok && data.success) {
          localStorage.setItem("token", data.token);
          toast({ title: "Success", description: "Account created with Google!" });
          window.location.href = "/";
        } else {
          toast({ title: "Error", description: data.message || "Google registration failed.", variant: "destructive" });
        }
      })
      .catch(err => {
        toast({ title: "Error", description: err.message || "Google registration failed.", variant: "destructive" });
      })
      .finally(() => setGoogleLoading(false));
  }

  // Google qeydiyyat düyməsi
  const onGoogleClick = () => {
    if (!googleRole) {
      setShowRoleModal(true);
      return;
    }
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt();
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Heart className="h-12 w-12 mx-auto text-white mb-4" />
          <h1 className="text-3xl font-bold text-white">Join Our Community</h1>
          <p className="text-white/80">Create your Critter Connections account</p>
        </div>

        <Card className="shadow-warm border-0">
          <CardHeader className="text-center">
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Fill in your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="Your full name"
                    value={formData.fullname}
                    onChange={(e) => updateFormData("fullname", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userName">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="userName"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.userName}
                    onChange={(e) => updateFormData("userName", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
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
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => updateFormData("role", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="ShelterOwner">Shelter Owner</SelectItem>
                    <SelectItem value="ClinicOwner">Clinic Owner</SelectItem>
                    <SelectItem value="ShopOwner">Shop Owner</SelectItem>
                    <SelectItem value="Doctor">Doctor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={onGoogleClick}
              disabled={googleLoading}
            >
              Continue with Google
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role seçimi üçün modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select your role before Google registration</DialogTitle>
          </DialogHeader>
          <Select value={googleRole} onValueChange={setGoogleRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Member">Member</SelectItem>
              <SelectItem value="ShelterOwner">Shelter Owner</SelectItem>
              <SelectItem value="ClinicOwner">Clinic Owner</SelectItem>
              <SelectItem value="ShopOwner">Shop Owner</SelectItem>
              <SelectItem value="Doctor">Doctor</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="mt-4 w-full"
            onClick={() => {
              setShowRoleModal(false);
              if (window.google && window.google.accounts && window.google.accounts.id) {
                window.google.accounts.id.prompt();
              }
            }}
            disabled={!googleRole}
          >
            Continue with Google
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisterPage;
