import { Outlet, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#18181b] border-r border-[#333] flex flex-col">
        <div className="p-6 text-[#fbbf24] text-2xl font-bold">Admin Panel</div>
        <nav className="flex-1 px-4 py-2 space-y-2">
          <Link
            to="/admin"
            className="block px-4 py-2 rounded hover:bg-[#232526] text-[#fbbf24]"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/pets"
            className="block px-4 py-2 rounded hover:bg-[#232526] text-[#fbbf24]"
          >
            Manage Pets
          </Link>
          <Link
            to="/admin/organizations"
            className="block px-4 py-2 rounded hover:bg-[#232526] text-[#fbbf24]"
          >
            Manage Organizations
          </Link>
          <Link
            to="/admin/breeds"
            className="block px-4 py-2 rounded hover:bg-[#232526] text-[#fbbf24]"
          >
            Manage Breeds
          </Link>
          <Link
            to="/admin/animals"
            className="block px-4 py-2 rounded hover:bg-[#232526] text-[#fbbf24]"
          >
            Manage Animals
          </Link>
          <Link
            to="/admin/users"
            className="block px-4 py-2 rounded hover:bg-[#232526] text-[#fbbf24]"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/services"
            className="block px-4 py-2 rounded hover:bg-[#232526] text-[#fbbf24]"
          >
            Manage Services
          </Link>
          <Link
            to="/admin/homeSlider"
            className="block px-4 py-2 rounded hover:bg-[#232526] text-[#fbbf24]"
          >
            Manage Home Slider
          </Link>
          <Link
            to="/admin/notifications"
            className="block px-4 py-2 rounded hover:bg-[#232526] text-[#fbbf24]"
          >
            Manage Notifications
          </Link>
          <Link
            to="/admin/products"
            className="block px-4 py-2 rounded hover:bg-[#232526] text-[#fbbf24]"
          >
            Manage Products
          </Link>

             <Link
            to="/admin/orders"
            className="block px-4 py-2 rounded hover:bg-[#232526] text-[#fbbf24]"
          >
            Manage Orders
          </Link>
          {/* Add more admin links here */}
        </nav>
        <div className="p-4">
          <Button
            variant="outline"
            className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-black w-full"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-[#232526] via-[#414345] to-[#232526]">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;