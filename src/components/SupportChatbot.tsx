import { useState } from "react";

const SupportChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: "user" | "bot" }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // UserId-ni localStorage-dan və ya sessionStorage-dan götür (əgər varsa)
  const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId") || "";

  // Backendə sorğu göndər
  const getBotReply = async (question: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/AiChat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, userId }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.reply || "Cavab tapılmadı.";
      }
      return "Serverdən cavab alınmadı.";
    } catch {
      return "Xəta baş verdi. Zəhmət olmasa bir az sonra yenidən yoxlayın.";
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, sender: "user" }]);
    setInput("");
    const reply = await getBotReply(input);
    setMessages(msgs => [...msgs, { text: reply, sender: "bot" }]);
  };

  return (
    <div style={{
      position: "fixed",
      right: 24,
      bottom: 24,
      zIndex: 9999,
      width: open ? 320 : 60,
      height: open ? 400 : 60,
      transition: "all 0.3s",
    }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: 60, height: 60, borderRadius: "50%", background: "#fbbe2470", color: "#222", fontWeight: "bold", boxShadow: "0 2px 8px #0002"
          }}
          aria-label="Dəstək Botunu Aç"
        >
          💬
        </button>
      ) : (
        <div style={{
          background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px #0002", height: "100%", display: "flex", flexDirection: "column"
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", fontWeight: "bold", color: "#fbbf24" }}>
            Dəstək Botu
            <button style={{ float: "right", background: "none", border: "none", fontSize: 18, cursor: "pointer" }} onClick={() => setOpen(false)}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ textAlign: msg.sender === "user" ? "right" : "left", margin: "8px 0" }}>
                <span style={{
                  display: "inline-block",
                  background: msg.sender === "user" ? "#fbbf24" : "#eee",
                  color: msg.sender === "user" ? "#222" : "#333",
                  borderRadius: 8,
                  padding: "6px 12px",
                  maxWidth: "80%",
                }}>
                  {msg.text}
                </span>
              </div>
            ))}
            {loading && (
              <div style={{ textAlign: "left", margin: "8px 0" }}>
                <span style={{
                  display: "inline-block",
                  background: "#eee",
                  color: "#333",
                  borderRadius: 8,
                  padding: "6px 12px",
                  maxWidth: "80%",
                }}>
                  Yazılır...
                </span>
              </div>
            )}
          </div>
          <div style={{ padding: 12, borderTop: "1px solid #eee", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Sualınızı yazın..."
              style={{ flex: 1, borderRadius: 8, border: "1px solid #ddd", padding: "8px" }}
              disabled={loading}
            />
            <button onClick={sendMessage} style={{ background: "#fbbf24", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: "bold" }} disabled={loading}>
              Göndər
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportChatbot;