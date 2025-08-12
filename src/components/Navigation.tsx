import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Home, ShoppingBag, Building2, Stethoscope, Users, LogOut, User, DollarSign, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Profile from "@/pages/Profile"; // Import the Profile component
import { Route } from "react-router-dom"; // Import Route
import { useEffect, useState } from "react";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, token } = useAuth(); // <-- token buradan alınır
  const { toast } = useToast();
  const [organization, setOrganization] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(user);
  const [cartCount, setCartCount] = useState<number>(0);
  const [balance, setBalance] = useState<number | null>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      logout();
      toast({
        title: "Success",
        description: "Logged out successfully!",
      });
      navigate("/");
    } catch (error) {
      // Logout locally even if API call fails
      logout();
      navigate("/");
    }
  };

  // Username priority: userName → fullname → name → email
  const displayName = user?.userName || user?.fullname || user?.name || user?.email || "";

  // Profil menyusu üçün təşkilat məlumatını yüklə
  useEffect(() => {
    const fetchMyOrg = async () => {
      try {
        const token = sessionStorage.getItem("token"); // <-- token-i buradan al
        if (!token) {
          setOrganization(null);
          return;
        }
        const res = await fetch("/api/Organization/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrganization(data);
        } else {
          setOrganization(null);
        }
      } catch {
        setOrganization(null);
      }
    };
    if (isAuthenticated) fetchMyOrg();
  }, [isAuthenticated]);

  // User details fetching
  useEffect(() => {
    const fetchUser = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/User/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserDetails(data);
        }
      } catch {}
    };
    if (isAuthenticated) fetchUser();
  }, [isAuthenticated]);

  // Səbət məlumatını sessionStorage-dan oxu
  useEffect(() => {
    const cart = JSON.parse(sessionStorage.getItem("cart") || "[]");
    setCartCount(cart.length);
  }, [location]); // location dəyişəndə səbət yenilənsin

  // Balance-i BalanceController-dən al
  useEffect(() => {
    const fetchBalance = async () => {
      if (!token) return;
      try {
        const res = await fetch("/api/Balance/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setBalance(await res.json());
        }
      } catch {}
    };
    if (isAuthenticated) fetchBalance();

    // Balans refresh eventini dinlə
    const handler = () => fetchBalance();
    window.addEventListener("balanceRefresh", handler);
    return () => window.removeEventListener("balanceRefresh", handler);
  }, [isAuthenticated, token]);

  return (
    <nav className="bg-white shadow-soft border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Critter Connections
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            <Button 
              variant={isActive("/") ? "default" : "ghost"}
              asChild
              className="transition-smooth"
            >
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            
            <Button 
              variant={isActive("/products") ? "default" : "ghost"}
              asChild
              className="transition-smooth"
            >
              <Link to="/products">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Products
              </Link>
            </Button>
            
            <Button 
              variant={isActive("/shelters") ? "default" : "ghost"}
              asChild
              className="transition-smooth"
            >
              <Link to="/shelters">
                <Building2 className="h-4 w-4 mr-2" />
                Shelters
              </Link>
            </Button>
            
            <Button 
              variant={isActive("/clinics") ? "default" : "ghost"}
              asChild
              className="transition-smooth"
            >
              <Link to="/clinics">
                <Stethoscope className="h-4 w-4 mr-2" />
                Clinics
              </Link>
            </Button>
            
            <Button 
              variant={isActive("/petshops") ? "default" : "ghost"}
              asChild
              className="transition-smooth"
            >
              <Link to="/petshops">
                <Users className="h-4 w-4 mr-2" />
                Pet Shops
              </Link>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Balance göstəricisi (BalanceController-dən gəlir) */}
            {isAuthenticated && balance !== null && (
              <div className="flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-medium mr-2">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>{balance}</span>
              </div>
            )}
            {/* Səbət ikonu və say göstəricisi */}
            <Link to="/cart" className="relative flex items-center mr-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5 font-bold shadow">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-2">
                    <User className="h-5 w-5 mr-1" />
                    <span className="text-sm text-muted-foreground hidden md:block">{displayName}</span>
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                  sideOffset={8}
                  className="bg-white rounded shadow-lg py-2 min-w-[150px] border"
                >
                  <DropdownMenu.Item asChild>
                    <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer">Profile</Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</Link>
                  </DropdownMenu.Item>
                  {/* Simple user type based navigation */}
                  {userDetails?.userType?.toLowerCase() === "member" ? (
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/mypets"
                        className="block px-4 py-2 hover:bg-gray-100 cursor-pointer text-primary"
                      >
                        My Pets
                      </Link>
                    </DropdownMenu.Item>
                  ) : userDetails?.userType?.toLowerCase() === "shopowner" ? (
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/shop-detail"
                        className="block px-4 py-2 hover:bg-gray-100 cursor-pointer text-primary"
                      >
                        My Shop
                      </Link>
                    </DropdownMenu.Item>
                  ) : userDetails?.userType?.toLowerCase() === "clinicowner" ? (
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/clinic-detail"
                        className="block px-4 py-2 hover:bg-gray-100 cursor-pointer text-primary"
                      >
                        My Clinic
                      </Link>
                    </DropdownMenu.Item>
                  ) : userDetails?.userType?.toLowerCase() === "shelterowner" ? (
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/shelter-detail"
                        className="block px-4 py-2 hover:bg-gray-100 cursor-pointer text-primary"
                      >
                        My Shelter
                      </Link>
                    </DropdownMenu.Item>
                  ) : null}
                  <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />
                  <DropdownMenu.Item
                    onSelect={handleLogout}
                    className="block px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
                  >
                    <LogOut className="inline h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

<Route path="/profile" element={<Profile />} />