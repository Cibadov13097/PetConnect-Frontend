import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCheck, XCircle, Truck, Package, RefreshCw, ArrowRight, Undo2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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

const ShopOrdersPage = () => {
  const { token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/Order/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setOrders(data))
      .finally(() => setLoading(false));
  }, [token, isAuthenticated]);

  const statusActions = [
    { label: "Confirm", endpoint: "confirm" },
    { label: "Process", endpoint: "process" },
    { label: "Ship", endpoint: "ship" },
    { label: "Deliver", endpoint: "deliver" },
    { label: "Cancel", endpoint: "cancel" },
    { label: "Return", endpoint: "return" },
  ];

  const handleChangeStatus = async (orderId: number, action: string) => {
    try {
      const res = await fetch(`/api/Order/${action}/${orderId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(orders =>
          orders.map(o =>
            o.id === orderId
              ? { ...o, orderStatus: updated.orderStatus || action.charAt(0).toUpperCase() + action.slice(1) }
              : o
          )
        );
      } else {
        alert("Status change failed");
      }
    } catch {
      alert("Status change failed");
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      const res = await fetch(`/api/Order/delete/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrders(orders => orders.filter(o => o.id !== orderId));
      } else {
        alert("Delete failed");
      }
    } catch {
      alert("Delete failed");
    }
  };

  const isActionEnabled = (orderStatus: string, action: string) => {
    if (
      (orderStatus === "Delivered" || orderStatus === "Returned") &&
      (action === "cancel" || action === "return")
    ) {
      return false;
    }
    if (orderStatus === "Cancelled") {
      return action === "return";
    }
    switch (action) {
      case "confirm":
        return orderStatus === "Pending";
      case "process":
        return orderStatus === "Confirmed";
      case "ship":
        return orderStatus === "Processing"; // <-- BURANI DƏYİŞDİM!
      case "deliver":
        return orderStatus === "Shipped" || orderStatus === "Cancelled";
      case "cancel":
        return true;
      case "return":
        return true;
      default:
        return false;
    }
  };

  const isDeleteEnabled = (orderStatus: string) =>
    orderStatus === "Delivered" || orderStatus === "Returned";

  const handleStatusButtonClick = (order: any, action: string) => {
    if (!isActionEnabled(order.orderStatus, action)) {
      toast({
        title: "Invalid action",
        description: "You can't perform this action at the current order status.",
        variant: "destructive",
      });
      return;
    }
    handleChangeStatus(order.id, action);
  };

  if (!isAuthenticated)
    return <div className="text-center py-12">Please login as a shop owner to view orders.</div>;

  if (loading) return <div className="text-center py-12">Loading orders...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Your Shop Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-muted-foreground">No orders found for your shop.</div>
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
                  <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium">User ID:</span> {order.userId}
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Items:</span>
                    <ul className="ml-4 list-disc text-sm mt-1">
                      {order.orderItems?.map((item: any, idx: number) => (
                        <li key={idx}>
                          <span className="font-semibold">{item.productName || `Product #${item.productId}`}</span>
                          <span className="ml-2 text-gray-500">x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {statusActions.map(action => (
                      <Button
                        key={action.endpoint}
                        onClick={() => handleStatusButtonClick(order, action.endpoint)}
                        disabled={!isActionEnabled(order.orderStatus, action.endpoint) || loading}
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                      >
                        {action.label}
                      </Button>
                    ))}
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteOrder(order.id)}
                      disabled={!isDeleteEnabled(order.orderStatus) || loading}
                      size="sm"
                      className="rounded-full"
                    >
                      Delete
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

export default ShopOrdersPage;