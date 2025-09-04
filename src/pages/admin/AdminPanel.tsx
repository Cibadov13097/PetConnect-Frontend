import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("adminToken");
    setToken(storedToken);
    if (!storedToken) {
      navigate("/admin/login");
    }
  }, [navigate]);

  return (
    <div>
      <h2 className="text-3xl font-bold text-[#fbbf24] mb-4">Admin Dashboard</h2>

      <div className="flex gap-4 flex-wrap">
        <button
          className="bg-[#fbbf24] text-black px-4 py-2 rounded font-semibold hover:bg-[#f59e42] transition"
          onClick={() => navigate("/admin/pets")}
        >
          Manage Pets
        </button>
        <button
          className="bg-[#fbbf24] text-black px-4 py-2 rounded font-semibold hover:bg-[#f59e42] transition"
          onClick={() => navigate("/admin/organizations")}
        >
          Manage Organizations
        </button>
        <button
          className="bg-[#fbbf24] text-black px-4 py-2 rounded font-semibold hover:bg-[#f59e42] transition"
          onClick={() => navigate("/admin/breeds")}
        >
          Manage Breeds
        </button>
        <button
          className="bg-[#fbbf24] text-black px-4 py-2 rounded font-semibold hover:bg-[#f59e42] transition"
          onClick={() => navigate("/admin/animals")}
        >
          Manage Animals
        </button>
        <button
          className="bg-[#fbbf24] text-black px-4 py-2 rounded font-semibold hover:bg-[#f59e42] transition"
          onClick={() => navigate("/admin/users")}
        >
          Manage Users
        </button>
        <button
          className="bg-[#fbbf24] text-black px-4 py-2 rounded font-semibold hover:bg-[#f59e42] transition"
          onClick={() => navigate("/admin/services")}
        >
          Manage Services
        </button>
        <button
          className="bg-[#fbbf24] text-black px-4 py-2 rounded font-semibold hover:bg-[#f59e42] transition"
          onClick={() => navigate("/admin/homeslider")}
        >
          Manage HomeSlider
        </button>
        <button
          className="bg-[#fbbf24] text-black px-4 py-2 rounded font-semibold hover:bg-[#f59e42] transition"
          onClick={() => navigate("/admin/notifications")}
        >
          Notification Section
        </button>
        <button
          className="bg-[#fbbf24] text-black px-4 py-2 rounded font-semibold hover:bg-[#f59e42] transition"
          onClick={() => navigate("/admin/orders")}
        >
          Manage Orders
        </button>
      </div>
      {/* Add dashboard widgets, stats, etc. */}
    </div>
  );
};

export default AdminPanel;