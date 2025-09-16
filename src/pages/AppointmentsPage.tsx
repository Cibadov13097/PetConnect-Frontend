import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Cancelled: "bg-red-100 text-red-800",
  Completed: "bg-green-100 text-green-800",
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const getDayKey = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 10); // yyyy-mm-dd
};

const getHour = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.getHours();
};

function getDaysArray(start: Date, end: Date) {
  const arr = [];
  let dt = new Date(start);
  while (dt <= end) {
    arr.push(dt.toISOString().slice(0, 10));
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
}

const API_BASE = import.meta.env.VITE_API_URL;

const AppointmentsPage = () => {
  const { token, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Tarix aralığı üçün state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().slice(0, 10);
  });
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${API_BASE}/api/Clinic/meAppointments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setAppointments(data))
      .finally(() => setLoading(false));
  }, [token, isAuthenticated]);

  // Servisləri backend-dən gətir
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${API_BASE}/api/Organization/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(org => {
        if (org && org.id) {
          fetch(`${API_BASE}/api/Service/organization/${org.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(res => res.ok ? res.json() : [])
            .then(data => setServices(Array.isArray(data) ? data : []))
            .catch(() => setServices([]));
        } else {
          setServices([]);
        }
      })
      .catch(() => setServices([]));
  }, [isAuthenticated, token]);

  // Filterlənmiş appointment-lər
  const filteredAppointments = serviceFilter === "all"
    ? appointments
    : appointments.filter(app => String(app.serviceId) === serviceFilter);

  // Calendar üçün günlər və saatlar
  const days = getDaysArray(new Date(startDate), new Date(endDate));
  const hours = Array.from({ length: 12 }, (_, i) => 8 + i); // 08:00 - 19:00

  // Appointment-ləri gün və saat üzrə qrupla
  const calendar: Record<string, Record<number, any>> = {};
  appointments.forEach(app => {
    const day = getDayKey(app.appointmentTime);
    const hour = getHour(app.appointmentTime);
    if (day >= startDate && day <= endDate) {
      if (!calendar[day]) calendar[day] = {};
      calendar[day][hour] = app;
    }
  });

  // Confirm appointment
  const handleConfirm = async (id: number) => {
    setActionLoading(true);
    const res = await fetch(`${API_BASE}/api/Clinic/confirmAppointment?appointmentId=${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setSelected(null);
      // Refresh appointments
      const data = await fetch(`${API_BASE}/api/Clinic/meAppointments`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());
      setAppointments(data);
    }
    setActionLoading(false);
  };

  // Cancel appointment
  const handleCancel = async (id: number) => {
    setActionLoading(true);
    const res = await fetch(`${API_BASE}/api/Clinic/cancelAppointment?appointmentId=${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setSelected(null);
      // Refresh appointments
      const data = await fetch(`${API_BASE}/api/Clinic/meAppointments`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());
      setAppointments(data);
    }
    setActionLoading(false);
  };

  // Complete appointment
  const handleComplete = async (id: number) => {
    // Vaxtı yoxla
    if (selected && new Date(selected.appointmentTime) > new Date()) {
      setInfoMsg("You can only complete the appointment after its scheduled time.");
      return;
    }
    setActionLoading(true);
    const res = await fetch(`${API_BASE}/api/Clinic/completeAppointment?appointmentId=${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setSelected(null);
      setInfoMsg(null);
      // Refresh appointments
      const data = await fetch(`${API_BASE}/api/Clinic/meAppointments`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());
      setAppointments(data);
    }
    setActionLoading(false);
  };

  if (!isAuthenticated)
    return <div className="text-center py-12">Please login to view appointments.</div>;

  if (loading) return <div className="text-center py-12">Loading appointments...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Clinic Appointments Calendar</h2>
      {/* Servis filteri */}
      <div className="flex gap-4 mb-4 items-center">
        <label className="font-medium">
          Filter by Service:
          <select
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
            className="ml-2 border rounded px-2 py-1"
          >
            <option value="all">All</option>
            {Array.isArray(services) && services.map((service: any) => (
              <option key={service.id} value={String(service.id)}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
        {/* Tarix aralığı seçimi */}
        <label className="font-medium">
          Start date:
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="ml-2 border rounded px-2 py-1"
          />
        </label>
        <label className="font-medium">
          End date:
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="ml-2 border rounded px-2 py-1"
          />
        </label>
      </div>
      {/* Filterlənmiş appointment-lər üçün calendar */}
      <div className="overflow-x-auto rounded-xl shadow border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left font-semibold">Time</th>
              {days.map(day => (
                <th key={day} className="px-2 py-2 text-center font-semibold">
                  {new Date(day).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "2-digit" })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => (
              <tr key={hour} className="border-b">
                <td className="px-2 py-2 font-bold">{`${hour.toString().padStart(2, "0")}:00`}</td>
                {days.map(day => {
                  // Filterlənmiş appointment-lərdən calendar qur
                  const app = filteredAppointments.find(app =>
                    getDayKey(app.appointmentTime) === day && getHour(app.appointmentTime) === hour
                  );
                  return (
                    <td key={day} className="px-2 py-2 text-center align-middle">
                      {app ? (
                        <button
                          className={`w-full rounded-lg px-2 py-1 font-medium shadow-sm border ${statusColors[app.appointmentStatus] || "bg-gray-100 text-gray-700"} hover:ring-2 hover:ring-primary transition`}
                          onClick={() => setSelected(app)}
                        >
                          #{app.id} <br />
                          {app.userName || app.userId}
                        </button>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal appointment detalları üçün */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setInfoMsg(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Appointment #{selected?.id}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <>
              {console.log(selected)}
              <div className="space-y-2">
                <div>
                  <b>Date & Time:</b> {formatDate(selected.appointmentTime)}
                </div>
                <div>
                  <b>Duration:</b> 30 min
                </div>
                <div>
                  <b>Owner:</b> {selected.userName || selected.userId}
                </div>
                <div>
                  <b>Service:</b> {selected.serviceName || selected.serviceId}
                </div>
                <div>
                  <b>Description:</b> {selected.description || "No description"}
                </div>
                <div>
                  <Badge className={statusColors[selected.appointmentStatus] || "bg-gray-100 text-gray-700"}>
                    {selected.appointmentStatus}
                  </Badge>
                </div>
                {/* Info mesajı */}
                {infoMsg && (
                  <div className="text-sm text-red-600 mb-2">{infoMsg}</div>
                )}
                {/* Confirm, Cancel və Complete düymələri */}
                {(selected.appointmentStatus === "Pending" || selected.appointmentStatus === "Confirmed") && (
                  <div className="flex gap-2 mt-4">
                    {selected.appointmentStatus === "Pending" && (
                      <Button
                        variant="default"
                        disabled={actionLoading}
                        onClick={() => handleConfirm(selected.id)}
                      >
                        Confirm
                      </Button>
                    )}
                    {(selected.appointmentStatus === "Pending" || selected.appointmentStatus === "Confirmed") && (
                      <Button
                        variant="destructive"
                        disabled={actionLoading}
                        onClick={() => handleCancel(selected.id)}
                      >
                        Cancel
                      </Button>
                    )}
                    {/* Complete düyməsi yalnız Confirmed statusunda görünür */}
                    {selected.appointmentStatus === "Confirmed" && (
                      <Button
                        variant="default"
                        disabled={actionLoading}
                        onClick={() => handleComplete(selected.id)}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentsPage;