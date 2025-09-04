import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Home, ShoppingBag, Building2, Stethoscope, Users, LogOut, User, DollarSign, ShoppingCart, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import notificationSound from "@/assets/audio/notification.mp3";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, token } = useAuth();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(user);
  const [cartCount, setCartCount] = useState<number>(0);
  const [balance, setBalance] = useState<number | null>(null);

  type Notification = {
    id: number;
    title: string;
    message: string;
    createdDate: string;
    isRead: boolean;
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    } catch {
      logout();
      navigate("/");
    }
  };

  const displayName = user?.userName || user?.fullname || user?.name || user?.email || "";

  // Organization info
  useEffect(() => {
    const fetchMyOrg = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          setOrganization(null);
          return;
        }
        const res = await fetch("/api/Organization/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setOrganization(await res.json());
        } else {
          setOrganization(null);
        }
      } catch {
        setOrganization(null);
      }
    };
    if (isAuthenticated) fetchMyOrg();
  }, [isAuthenticated]);

  // User details
  useEffect(() => {
    const fetchUser = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/User/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setUserDetails(await res.json());
        }
      } catch {}
    };
    if (isAuthenticated) fetchUser();
  }, [isAuthenticated]);

  // Cart count
  useEffect(() => {
    const cart = JSON.parse(sessionStorage.getItem("cart") || "[]");
    setCartCount(cart.length);
  }, [location]);

  // Balance
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

    const handler = () => fetchBalance();
    window.addEventListener("balanceRefresh", handler);
    return () => window.removeEventListener("balanceRefresh", handler);
  }, [isAuthenticated, token]);

  // Notifications initial fetch
  useEffect(() => {
    if (!token) return;
    fetch("/api/Notification/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : [])
      .then((data) => {
        // Tarixə görə azalan sırala (ən son gələn başda)
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
        );
        setNotifications(sorted);
      })
      .catch(() => setNotifications([]));
  }, [token]);

  // SignalR setup
  useEffect(() => {
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7213/notificationHub", {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => console.log("SignalR connected"))
      .catch(err => console.error("SignalR connection error", err));

    connection.on("ReceiveNotification", (notif: Notification) => {
      console.log("Yeni notification gəldi:", notif);
      setNotifications(prev =>
        [notif, ...prev].sort(
          (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
        )
      );
      // Səs çalsın
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    });

    return () => {
      connection.stop();
    };
  }, [token]);

  const markAsRead = async (id: number) => {
    await fetch(`/api/Notification/${id}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(n =>
      n.map(notif => notif.id === id ? { ...notif, isRead: true } : notif)
    );
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    // Example: navigate(`/product/${notif.productId}`);
  };

  return (
    <nav className="bg-white shadow-soft border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Pet Connect
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            <Button variant={isActive("/") ? "default" : "ghost"} asChild className="transition-smooth">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            <Button variant={isActive("/products") ? "default" : "ghost"} asChild className="transition-smooth">
              <Link to="/products">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Products
              </Link>
            </Button>
            <Button variant={isActive("/shelters") ? "default" : "ghost"} asChild className="transition-smooth">
              <Link to="/shelters">
                <Building2 className="h-4 w-4 mr-2" />
                Shelters
              </Link>
            </Button>
            <Button variant={isActive("/clinics") ? "default" : "ghost"} asChild className="transition-smooth">
              <Link to="/clinics">
                <Stethoscope className="h-4 w-4 mr-2" />
                Clinics
              </Link>
            </Button>
            <Button variant={isActive("/petshops") ? "default" : "ghost"} asChild className="transition-smooth">
              <Link to="/petshops">
                <Users className="h-4 w-4 mr-2" />
                Pet Shops
              </Link>
            </Button>
            <Button variant={isActive("/pair-pet") ? "default" : "ghost"} asChild className="transition-smooth">
              <Link to="/pair-pet">
                <Heart className="h-4 w-4 mr-2" />
                Pair Pets
              </Link>
            </Button>

            
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && balance !== null && (
              <div className="flex items-center justify-center w-16 h-10 rounded-full bg-primary/10 text-primary font-medium px-2">
                <span className="text-base font-bold mr-1">${Number(balance).toFixed(1)}</span>
              </div>
            )}
            <Button variant="ghost" className="relative flex items-center justify-center w-10 h-10" aria-label="Notifications" onClick={() => setShowNotifications(v => !v)}>
              <Bell className="h-6 w-6 text-primary" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </Button>
            <Link to="/cart" className="relative flex items-center justify-center w-10 h-10">
              <ShoppingCart className="h-6 w-6 text-primary" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5 font-bold shadow">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-2">
                    <User className="h-5 w-5 mr-1" />
                    <span className="text-sm text-muted-foreground hidden md:block">{displayName}</span>
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content sideOffset={8} className="bg-white rounded shadow-lg py-2 min-w-[150px] border">
                  <DropdownMenu.Item asChild>
                    <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer">Profile</Link>
                  </DropdownMenu.Item>
                  
                  <DropdownMenu.Item asChild>
                    <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</Link>
                  </DropdownMenu.Item>
                  {userDetails?.userType?.toLowerCase() === "member" ? (
                    <>
                      <DropdownMenu.Item asChild>
                        <Link to="/myorders" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer text-primary">
                          My Orders
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link to="/mypets" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer text-primary">
                          My Pets
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link to="/member-subscription" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer text-primary">
                          My Subscription Plan
                        </Link>
                      </DropdownMenu.Item>
                      
                     
                    </>
                  ) : userDetails?.userType?.toLowerCase() === "shopowner" ? (
                    <DropdownMenu.Item asChild>
                      <Link to="/shop-detail" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer text-primary">
                        My Shop
                      </Link>
                    </DropdownMenu.Item>
                  ) : userDetails?.userType?.toLowerCase() === "clinicowner" ? (
                    <DropdownMenu.Item asChild>
                      <Link to="/clinic-detail" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer text-primary">
                        My Clinic
                      </Link>
                    </DropdownMenu.Item>
                  ) : userDetails?.userType?.toLowerCase() === "shelterowner" ? (
                    <DropdownMenu.Item asChild>
                      <Link to="/shelter-detail" className="block px-4 py-2 hover:bg-gray-100 cursor-pointer text-primary">
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

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 top-12 z-50 bg-white shadow-lg rounded-lg w-80 p-4">
          <h2 className="font-bold mb-2">Notifications</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <div className="text-muted-foreground">No notifications.</div>
            )}
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-2 rounded ${notif.isRead ? "bg-gray-100" : "bg-primary/10"}`}
                onClick={() => handleNotificationClick(notif)}
                style={{ cursor: notif.isRead ? "default" : "pointer" }}
              >
                <div className="font-medium">{notif.title}</div>
                <div className="text-sm">{notif.message}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(notif.createdDate).toLocaleString()}
                </div>
                {!notif.isRead && (
                  <span className="text-xs text-primary">Click to mark as read</span>
                )}
              </div>
            ))}
          </div>
          {/* Mark All as Read button əlavə et */}
          <Button
            variant="default"
            className="mt-2 w-full"
            onClick={async () => {
              await fetch("https://localhost:7213/api/Notification/readAll", {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
              });
              // Backenddən yenidən fetch et!
              const res = await fetch("https://localhost:7213/api/Notification/me", {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                const data = await res.json();
                const sorted = [...data].sort(
                  (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
                );
                setNotifications(sorted);
              }
            }}
          >
            Mark All as Read
          </Button>
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => setShowNotifications(false)}
          >
            Close
          </Button>
        </div>
      )}
      <audio ref={audioRef} src={notificationSound} preload="auto" />
    </nav>
  );
};

export default Navigation;