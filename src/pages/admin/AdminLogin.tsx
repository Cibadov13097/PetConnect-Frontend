import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const AdminLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/Account/Login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      sessionStorage.setItem("adminToken", data.token);
      navigate("/admin");
    } else {
      setError(data.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#232526] via-[#414345] to-[#232526]">
      <Card className="w-full max-w-md bg-[#18181b] border border-[#333] shadow-xl">
        <CardHeader>
          <CardTitle className="text-[#fbbf24] text-3xl font-extrabold text-center">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleLogin}>
            <Input
              type="email"
              placeholder="Admin Email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              className="bg-[#232526] text-[#fbbf24] border-[#fbbf24] placeholder-[#fbbf24] focus:ring-[#fbbf24]"
            />
            <Input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              className="bg-[#232526] text-[#fbbf24] border-[#fbbf24] placeholder-[#fbbf24] focus:ring-[#fbbf24]"
            />
            {error && <div className="text-[#ef4444] bg-[#232526] border border-[#ef4444] rounded py-2 px-3 text-center">{error}</div>}
            <Button type="submit" className="w-full py-2 rounded bg-[#fbbf24] text-black hover:bg-[#f59e42]">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;