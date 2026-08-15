"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function MessagesPage() {
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadThreads() {
    const { data: msgs } = await supabase.from("messages").select("*").order("created_at", { ascending: true });
    const { data: profiles } = await supabase.from("profiles").select("id, nom, prenom");
    const nameById = Object.fromEntries((profiles || []).map((p) => [p.id, `${p.prenom} ${p.nom}`]));

    const byClient = {};
    (msgs || []).forEach((m) => {
      byClient[m.client_id] = byClient[m.client_id] || [];
      byClient[m.client_id].push(m);
    });

    const list = Object.entries(byClient).map(([clientId, list]) => ({
      clientId,
      name: nameById[clientId] || "Client",
      last: list[list.length - 1],
      unread: list.filter((m) => m.from_role === "client" && !m.read).length,
    }));
    // Les conversations avec des messages non lus remontent en premier
    list.sort((a, b) => (b.unread > 0) - (a.unread > 0) || new Date(b.last?.created_at) - new Date(a.last?.created_at));
    setThreads(list);
    setLoading(false);
  }

  useEffect(() => {
    loadThreads();

    const channel = supabase
      .channel("vendor-threads-watch")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => loadThreads())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (!selected) return;
    let active = true;

    async function load() {
      const { data } = await supabase.from("messages").select("*").eq("client_id", selected.clientId).order("created_at", { ascending: true });
      if (active) setThread(data || []);

      // Marque comme lus les messages du client dès qu'on ouvre la conversation
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("client_id", selected.clientId)
        .eq("from_role", "client")
        .eq("read", false);
    }
    load();

    const channel = supabase
      .channel(`vendor-messages-${selected.clientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `client_id=eq.${selected.clientId}` },
        (payload) => setThread((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [selected]);

  async function send() {
    if (!draft.trim() || !selected) return;
    const text = draft.trim();
    setDraft("");
    await supabase.from("messages").insert({ client_id: selected.clientId, from_role: "vendor", text });
  }

  return (
    <div>
      <div className="font-semibold text-lg mb-3">Messagerie clients</div>
      <div className="grid sm:grid-cols-[200px_1fr] bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="border-r border-gray-200">
          {loading && <div className="text-sm text-gray-400 p-3">Chargement…</div>}
          {!loading && threads.length === 0 && <div className="text-sm text-gray-400 p-3">Aucun message.</div>}
          {threads.map((t) => (
            <button
              key={t.clientId}
              onClick={() => setSelected(t)}
              className={`w-full text-left p-2.5 text-sm border-b border-gray-100 flex items-start justify-between gap-2 ${selected?.clientId === t.clientId ? "bg-gray-100" : "hover:bg-gray-50"}`}
            >
              <div className="min-w-0">
                <div className={t.unread > 0 ? "font-semibold" : ""}>{t.name}</div>
                <div className="text-xs text-gray-400 truncate">{t.last?.text}</div>
              </div>
              {t.unread > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-semibold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  {t.unread > 9 ? "9+" : t.unread}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-col min-h-[16rem]">
          {!selected ? (
            <div className="p-4 text-sm text-gray-400">Sélectionnez une conversation.</div>
          ) : (
            <>
              <div className="flex-1 p-3 space-y-2 max-h-72 overflow-y-auto">
                {thread.map((m) => (
                  <div key={m.id} className={`text-xs max-w-[75%] p-2 rounded-lg ${m.from_role === "vendor" ? "ml-auto bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 p-2 flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Répondre…"
                  className="flex-1 border border-gray-300 rounded-md p-1.5 text-xs"
                />
                <button onClick={send} className="bg-gray-100 rounded-md px-2 hover:bg-gray-200">
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
