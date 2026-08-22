import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { when } from "../../utils/format.js";

export default function MessagesPage() {
  const { user, socket } = useAuth();
  const [messages, setMessages] = useState([]);

  const load = async () => {
    const data = await api.messages();
    setMessages(data.messages || []);
  };

  useEffect(() => { load().catch((error) => toast.error(error.message)); }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const onMessage = () => load().catch(() => {});
    socket.on("message", onMessage);
    return () => socket.off("message", onMessage);
  }, [socket]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Messages</h1>
          <p>Talk to the mart, farm or driver on an order. Phone numbers stay visible on every card if you need to call.</p>
        </div>
      </div>
      <div className="card chat">
        <div className="bubbles">
          {messages.length === 0 && <div className="empty-state">No messages yet. Open an order to start a conversation.</div>}
          {messages.slice().reverse().map((message) => {
            const mine = String(message.from?._id) === String(user._id);
            const other = mine ? message.to : message.from;
            return (
              <div key={message._id} className={`bubble ${mine ? "mine" : ""}`}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {mine ? "You" : other?.name} · {other?.phone} · {when(message.createdAt)}
                </div>
                {message.body}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
