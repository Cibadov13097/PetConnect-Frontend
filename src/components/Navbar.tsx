import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-bold">PetConnect</Link>
        <Link to="/shops" className="hover:underline">Pet Shops</Link>
        <Link to="/clinics" className="hover:underline">Clinics</Link>
        <Link to="/shelters" className="hover:underline">Shelters</Link>
      </div>
      <div>
        {isAuthenticated && user ? (
          <span className="font-medium">Salam, {user.userName}</span>
        ) : (
          <Link to="/login" className="text-blue-600 hover:underline">Daxil ol</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;