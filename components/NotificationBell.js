"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fmtDate } from "@/lib/helpers";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (active) setNotifications(data || []);
    }
    load();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `client_id=eq.${user.id}` },
        (payload) => setNotifications((prev) => [payload.new, ...prev])
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("client_id", user.id).eq("read", false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markAllRead();
        }}
        className="relative p-1.5 rounded-md hover:bg-gray-100"
        title="Notifications"
      >
        <Bell size={17} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-xl z-40">
            <div className="text-sm font-medium px-3 py-2 border-b border-gray-200">Notifications</div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && <div className="text-xs text-gray-400 p-4 text-center">Aucune notification pour l'instant.</div>}
              {notifications.map((n) => (
                <div key={n.id} className="px-3 py-2.5 text-sm border-b border-gray-100 last:border-0 flex items-start gap-2">
                  <Check size={14} className="text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-gray-800">{n.message}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{fmtDate(n.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
