import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "https://localhost:7213";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (password: string) => {
    // 8-30 simvol, ən azı bir böyük, bir kiçik hərf, bir rəqəm və bir simvol
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,30}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validatePassword(newPassword)) {
      setError(
        "Password must be 8-30 characters, contain uppercase, lowercase, a number and a symbol."
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/Account/ResetPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });
      if (res.ok) {
        toast({
          title: "Success",
          description: "Password reset successfully. You can now login.",
        });
        setDone(true);
      } else {
        const err = await res.json();
        toast({
          title: "Error",
          description: err?.errors?.[0]?.description || "Failed to reset password.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="text-green-600 text-center">
                Password reset successfully!
                <Button className="mt-4 w-full" onClick={() => navigate("/login")}>
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                  {error && (
                    <div className="text-red-500 text-sm mt-2">{error}</div>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading || !newPassword}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;