import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { BadgeCheck, XCircle, Truck, Package, RefreshCw, ArrowRight, Undo2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

const API_BASE = "https://localhost:7213";

const statusColors: Record<string, string> = {
  Pending: "bg-gray-200 text-gray-700",
  Confirmed: "bg-blue-200 text-blue-800",
  Processing: "bg-yellow-200 text-yellow-800",
  Shipped: "bg-indigo-200 text-indigo-800",
  Delivered: "bg-green-200 text-green-800",
  Cancelled: "bg-red-200 text-red-800",
  Returned: "bg-orange-200 text-orange-800",
};

const statusIcons: Record<string, JSX.Element> = {
  Pending: <RefreshCw className="inline w-4 h-4 mr-1" />,
  Confirmed: <BadgeCheck className="inline w-4 h-4 mr-1" />,
  Processing: <Package className="inline w-4 h-4 mr-1" />,
  Shipped: <Truck className="inline w-4 h-4 mr-1" />,
  Delivered: <ArrowRight className="inline w-4 h-4 mr-1" />,
  Cancelled: <XCircle className="inline w-4 h-4 mr-1" />,
  Returned: <Undo2 className="inline w-4 h-4 mr-1" />,
};

type OrderItem = {
  productId: number;
  productName: string;
  quantity: number;
};

type Order = {
  id: number;
  userId: number;
  shopId: number;
  isDelete: boolean;
  orderStatus: string;
  orderItems: OrderItem[];
  total?: number;
};

const MyOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, token } = useAuth();

  // Cancel order handler
  const handleCancelOrder = async (orderId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/Order/cancel/${orderId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrders(orders =>
          orders.map(o =>
            o.id === orderId ? { ...o, orderStatus: "Cancelled" } : o
          )
        );
        toast({
          title: "Order cancelled",
          description: "Order status changed to Cancelled.",
          variant: "default",
        });
      } else {
        toast({
          title: "Cancel failed",
          description: "Order could not be cancelled.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Cancel failed",
        description: "Order could not be cancelled.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/api/Order/meUser`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setOrders(data))
      .finally(() => setLoading(false));
  }, [isAuthenticated, token]);

  return (
    <div className="container mx-auto px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-muted-foreground">No orders found.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="rounded-xl shadow-md border bg-white hover:shadow-lg transition-all p-6 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-lg">
                      Order #{order.id}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusColors[order.orderStatus] || "bg-gray-100 text-gray-700"}`}
                    >
                      {statusIcons[order.orderStatus] || null}
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="mb-2 text-sm text-muted-foreground">
                    Shop ID: {order.shopId}
                  </div>
                  <div>
                    <span className="font-medium">Items:</span>
                    <ul className="ml-4 list-disc text-sm mt-1">
                      {order.orderItems.map(item => (
                        <li key={item.productId}>
                          <span className="font-semibold">{item.productName}</span>
                          <span className="ml-2 text-gray-500">x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Total:</span>
                    <span className="ml-2 text-green-600 font-bold">
                      {order.total?.toFixed(2) ?? "-"} ₼
                    </span>
                  </div>
                  {/* Cancel button */}
                  {order.orderStatus !== "Cancelled" && order.orderStatus !== "Delivered" && order.orderStatus !== "Returned" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-2 w-fit"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyOrdersPage;