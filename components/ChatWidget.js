"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fmtTime } from "@/lib/helpers";
import { useAuth } from "@/contexts/AuthContext";

export default function ChatWidget() {
  const { user, openAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");

  // Charge les messages et écoute les nouveaux dès que l'utilisateur est
  // connecté, même si la fenêtre de chat est fermée (pour le badge non lus).
  useEffect(() => {
    if (!user) return;

    let active = true;
    async function load() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: true });
      if (active) setMessages(data || []);
    }
    load();

    const channel = supabase
      .channel(`messages-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `client_id=eq.${user.id}` },
        (payload) => setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]))
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = messages.filter((m) => m.from_role === "vendor" && !m.read).length;

  async function openChat() {
    if (!user) return openAuth("login");
    setOpen(true);
    if (unreadCount === 0) return;
    setMessages((prev) => prev.map((m) => (m.from_role === "vendor" ? { ...m, read: true } : m)));
    await supabase.from("messages").update({ read: true }).eq("client_id", user.id).eq("from_role", "vendor").eq("read", false);
  }

  async function send() {
    if (!draft.trim() || !user) return;
    const text = draft.trim();
    setDraft("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ client_id: user.id, from_role: "client", text })
      .select()
      .single();
    if (!error && data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
    }
  }

  return (
    <>
      <button
        onClick={() => (open ? setOpen(false) : openChat())}
        className="fixed bottom-5 right-5 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg z-40 hover:bg-blue-700"
      >
        <MessageCircle size={20} />
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && user && (
        <div className="fixed bottom-20 right-5 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-xl z-40 flex flex-col">
          <div className="text-sm px-3 py-2 border-b border-gray-200 flex items-center justify-between font-medium">
            Discuter avec la boutique
            <button onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 p-3 space-y-2 max-h-64 overflow-y-auto">
            {messages.length === 0 && <div className="text-xs text-gray-400">Posez votre question ici.</div>}
            {messages.map((m) => (
              <div key={m.id} className={`max-w-[85%] ${m.from_role === "client" ? "ml-auto" : ""}`}>
                <div className={`text-xs p-2 rounded-lg ${m.from_role === "client" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                  {m.text}
                </div>
                <div className={`text-[10px] text-gray-400 mt-0.5 ${m.from_role === "client" ? "text-right" : ""}`}>{fmtTime(m.created_at)}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 p-2 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Votre message…"
              className="flex-1 border border-gray-300 rounded-md p-1.5 text-xs"
            />
            <button onClick={send} className="bg-gray-100 rounded-md px-2 hover:bg-gray-200">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
