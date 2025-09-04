import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const API_BASE = "https://localhost:7213";

const ResetEmailPage = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const token = searchParams.get("token") || "";
  const userId = searchParams.get("userId") || "";
  const newEmail = searchParams.get("newEmail") || "";

  const handleConfirm = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/Account/ConfirmChangeEmail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newEmail, token }),
    });
    if (res.ok) {
      toast({ title: "Email changed successfully!" });
      // Burada user məlumatını yeniləyə bilərsən (fetchUser və ya navigate)
      navigate("/profile");
    } else {
      const err = await res.json();
      toast({
        title: "Failed to change email",
        description: err.errors?.[0]?.description || "Unknown error",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Confirm Email Change</h2>
        <p className="mb-4">Click the button below to confirm your email change to <b>{newEmail}</b>.</p>
        <Button onClick={handleConfirm} disabled={loading}>
          {loading ? "Confirming..." : "Confirm Email Change"}
        </Button>
      </div>
    </div>
  );
};

export default ResetEmailPage;