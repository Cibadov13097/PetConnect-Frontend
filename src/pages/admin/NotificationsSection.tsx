import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const NotificationsSection = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem("adminToken") || "";

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      const res = await fetch("/api/admin/notification/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setNotifications(await res.json());
      setLoading(false);
    };
    fetchNotifications();

    // --- SignalR connection ---
    const connection = new HubConnectionBuilder()
      .withUrl("https://localhost:7213/notificationHub", {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connection.start().then(() => console.log("SignalR connected")).catch(console.error);

    connection.on("ReceiveNotification", (notification: any) => {
      console.log("Live notification received:", notification);
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      connection.stop();
    };
  }, [token]);

  const markAsRead = async (id: number) => {
    await fetch(`/api/admin/notification/${id}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(n => n.map(notif => notif.id === id ? { ...notif, isRead: true } : notif));
  };

  const deleteNotification = async (id: number) => {
    await fetch(`/api/admin/notification/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(n => n.filter(notif => notif.id !== id));
  };

  const readAllNotifications = async () => {
    await fetch("https://localhost:7213/api/Notification/readAll", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    // Bildirişləri yenidən al
    const res = await fetch("/api/admin/notification/getAll", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setNotifications(await res.json());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-extrabold mb-4 text-[#fbbf24]">Notifications</h2>
      <div className="mb-4">
        <Button variant="outline" onClick={readAllNotifications}>
          Mark All as Read
        </Button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : notifications.length === 0 ? (
        <div>No notifications found.</div>
      ) : (
        <div className="space-y-4">
          {notifications.map(notif => (
            <div key={notif.id} className="p-4 border rounded flex flex-col md:flex-row md:items-center md:justify-between bg-white shadow">
              <div>
                <div className="font-bold">{notif.title || "Notification"}</div>
                <div className="text-sm text-gray-500">{notif.message}</div>
                <div className="text-xs text-gray-400">User: {notif.userId}</div>
                <div className="text-xs text-gray-400">Status: {notif.isRead ? "Read" : "Unread"}</div>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                {!notif.isRead && (
                  <Button size="sm" variant="default" onClick={() => markAsRead(notif.id)}>
                    Mark as Read
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => deleteNotification(notif.id)}>
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

export default NotificationsSection;
