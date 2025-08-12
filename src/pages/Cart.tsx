import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

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
      const res = await fetch("/api/Balance/me", {
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
      const res = await fetch("/api/Order/Add", {
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
                <div key={idx} className="flex items-center justify-between border-b py-2">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <span>Count:</span>
                      <input
                        type="number"
                        min={1}
                        value={item.count}
                        onChange={e =>
                          handleCountChange(idx, Math.max(1, Number(e.target.value)))
                        }
                        className="w-16 px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="font-bold">{item.price} ₼</div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemove(idx)}
                      title="Remove from cart"
                    >
                      <Trash2 className="h-4 w-4" />
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