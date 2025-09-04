import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const ManageOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUserId, setSearchUserId] = useState("");
  const [searchShopId, setSearchShopId] = useState("");
  const token = sessionStorage.getItem("adminToken") || "";

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [token]);

  const fetchOrders = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/order/getAll", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = [];
    if (searchUserId.trim()) params.push(`userId=${encodeURIComponent(searchUserId)}`);
    if (searchShopId.trim()) params.push(`shopId=${encodeURIComponent(searchShopId)}`);
    const res = await fetch(`/api/admin/order/search?${params.join("&")}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setOrders(await res.json());
    else setOrders([]);
    setLoading(false);
  };

  const handleDeleteOrder = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    const res = await fetch(`/api/admin/order/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setOrders(orders => orders.filter(o => o.id !== id));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-extrabold mb-4 text-[#fbbf24]">Manage Orders</h2>
      <form className="flex gap-2 mb-6" onSubmit={handleSearch}>
        <input
          className="border px-2 py-1 rounded"
          placeholder="Search by User ID"
          value={searchUserId}
          onChange={e => setSearchUserId(e.target.value)}
        />
        <input
          className="border px-2 py-1 rounded"
          placeholder="Search by Shop ID"
          value={searchShopId}
          onChange={e => setSearchShopId(e.target.value)}
        />
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSearchUserId("");
            setSearchShopId("");
            fetchOrders();
          }}
        >
          Clear
        </Button>
      </form>
      {loading ? (
        <div>Loading...</div>
      ) : orders.length === 0 ? (
        <div>No orders found.</div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="p-4 border rounded bg-white shadow">
              <div className="font-bold text-[#fbbf24]">Order #{order.id}</div>
              <div className="text-xs text-gray-400">User ID: {order.userId}</div>
              <div className="text-xs text-gray-400">Shop ID: {order.shopId}</div>
              <div className="text-xs text-gray-400">Status: {order.orderStatus}</div>
              <div className="text-xs text-gray-400">Deleted: {order.isDelete ? "Yes" : "No"}</div>
              <div className="mt-2">
                <b>Items:</b>
                <ul className="list-disc ml-6">
                  {order.orderItems.map((item: any, idx: number) => (
                    <li key={idx}>
                      {item.productName} (x{item.quantity}) - {item.price} ₼
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-2">
                <Button variant="destructive" size="sm" onClick={() => handleDeleteOrder(order.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageOrders;