import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

const Cart = () => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const { token, user, isAuthenticated } = useAuth(); // isAuthenticated əlavə et
  const navigate = useNavigate(); // əlavə et
  const { toast } = useToast();

  useEffect(() => {
    const cart = JSON.parse(sessionStorage.getItem("cart") || "[]");
    const cartWithCount = cart.map((item: any) => ({
      ...item,
      count: item.count !== undefined ? item.count : 1,
    }));
    setCartItems(cartWithCount);
  }, []);

  // Count dəyişəndə həm state-i, həm sessionStorage-u yenilə
  const handleCountChange = (idx: number, value: number) => {
    const updated = cartItems.map((item, i) =>
      i === idx ? { ...item, count: value } : item
    );
    setCartItems(updated);
    sessionStorage.setItem("cart", JSON.stringify(updated));
  };

  const handleRemove = (idx: number) => {
    const updated = cartItems.filter((_, i) => i !== idx);
    setCartItems(updated);
    sessionStorage.setItem("cart", JSON.stringify(updated));
  };

  // Total product count və total price hesabla
  const totalCount = cartItems.reduce((sum, item) => sum + (item.count || 1), 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * (item.count || 1)), 0);

  const handleOrder = async () => {
    if (!isAuthenticated) {
      toast({ title: "Please login to order.", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (cartItems.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }

    // Ən son balansı backend-dən al
    let latestBudget = user?.budget ?? 0;
    try {
      const res = await fetch(`${API_BASE}/api/Balance/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        latestBudget = await res.json();
      }
    } catch {}

    if (latestBudget < totalPrice) {
      toast({
        title: "Insufficient balance",
        description: "Your balance is not enough to complete this order.",
        variant: "destructive",
      });
      return;
    }

    const shopId = cartItems[0].shopId;
    const orderDto = {
      ShopId: shopId,
      OrderItems: cartItems.map(item => ({
        ProductId: item.id,
        Quantity: item.count || 1,
      })),
    };
    try {
      const res = await fetch(`${API_BASE}/api/Order/Add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderDto),
      });
      if (res.ok) {
        toast({ title: "Order confirmed!" });
        setCartItems([]);
        sessionStorage.removeItem("cart");
        // Balans refresh üçün event göndər
        window.dispatchEvent(new Event("balanceRefresh"));
      } else {
        const errorText = await res.text();
        toast({
          title: "Order failed",
          description: errorText,
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({ title: "Order failed", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Total info card */}
      <div className="flex justify-center mb-8">
        <Card className="w-full max-w-md text-center shadow-lg border-0 bg-primary/10">
          <CardHeader>
            <CardTitle>Cart Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-lg font-semibold">
              <div>
                Total Products:{" "}
                <span className="text-primary">{totalCount}</span>
              </div>
              <div>
                Total Price:{" "}
                <span className="text-primary">{totalPrice} ₼</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Confirm Order düyməsi */}
      <div className="flex justify-center mb-8">
        <Button
          className="px-8 py-3 text-lg font-bold rounded-full"
          onClick={handleOrder}
          disabled={cartItems.length === 0}
        >
          Confirm Order
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Cart</CardTitle>
        </CardHeader>
        <CardContent>
          {cartItems.length === 0 ? (
            <p className="text-muted-foreground">Your cart is empty.</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b py-4 gap-4 bg-gradient-to-r from-white via-primary/5 to-secondary/10 rounded-xl shadow-sm hover:shadow-lg transition-all"
                >
                  {/* Məhsul şəkli */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center mr-2">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl text-muted-foreground">🛒</span>
                    )}
                  </div>
                  {/* Məhsul məlumatları */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg truncate">{item.name}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">{item.description}</div>
                    {/* Yeni count dizaynı */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-muted-foreground">Count:</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-full px-2 py-1"
                        onClick={() => handleCountChange(idx, Math.max(1, item.count - 1))}
                        disabled={item.count <= 1}
                        aria-label="Decrease"
                      >
                        <span className="font-bold text-lg">−</span>
                      </Button>
                      <span className="px-3 py-1 bg-primary/10 rounded font-bold text-primary text-base min-w-[32px] text-center select-none">
                        {item.count}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-full px-2 py-1"
                        onClick={() => handleCountChange(idx, item.count + 1)}
                        aria-label="Increase"
                      >
                        <span className="font-bold text-lg">+</span>
                      </Button>
                    </div>
                  </div>
                  {/* Qiymət və sil düyməsi */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="font-bold text-primary text-lg">{item.price} ₼</div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemove(idx)}
                      title="Remove from cart"
                      className="rounded-full shadow hover:bg-red-600 transition"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Cart;