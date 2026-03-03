"use client";

import { useEffect, useState } from "react";
import { Video, Plus, Search, Users, Clock, Activity, LogOut, User } from "lucide-react";
import { useAuthStore } from "@/shared/store/authStore";
import { MeetingCard } from "@/features/meetings/components/MeetingCard";
import { CreateMeetingModal } from "@/features/meetings/components/CreateMeetingModal";
import { Button } from "@/shared/components/ui/Button";
import type { Meeting } from "@/shared/types";

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => { loadMeetings(); }, []);

  async function loadMeetings() {
    try {
      const res = await fetch("/api/meetings");
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    if (res.ok) setMeetings((prev) => prev.filter((m) => m.id !== id));
  }

  const filtered = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    active: meetings.filter((m) => m.status === "active").length,
    scheduled: meetings.filter((m) => m.status === "scheduled").length,
    ended: meetings.filter((m) => m.status === "ended").length,
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3.5 bg-[#1a1a1a]/95 border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00a0d1] rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white">Make Flow IA</span>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva reunión
          </Button>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-full bg-[#00a0d1] flex items-center justify-center text-sm font-semibold text-white hover:bg-[#0088b8] transition-colors"
            >
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-10 z-30 bg-[#2d2d2d] border border-white/10 rounded-xl shadow-xl w-52 py-1 animate-fade-in">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-[#6e6e6e] mt-0.5 truncate">{user?.email}</p>
                </div>
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="w-4 h-4 text-[#6e6e6e]" />
                  Mi perfil
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#e74c3c] hover:bg-white/10 transition-colors"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Hola, {user?.name?.split(" ")[0] ?? "Usuario"} 👋
          </h1>
          <p className="text-[#6e6e6e] mt-1">Gestiona tus videoconferencias</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard icon={<Activity className="w-5 h-5 text-[#27ae60]" />} label="En curso" value={stats.active} color="green" />
          <StatCard icon={<Clock className="w-5 h-5 text-[#00a0d1]" />} label="Programadas" value={stats.scheduled} color="blue" />
          <StatCard icon={<Users className="w-5 h-5 text-[#6e6e6e]" />} label="Finalizadas" value={stats.ended} color="gray" />
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e6e]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar reunión..."
              className="w-full bg-[#242424] border border-white/10 rounded-lg text-white placeholder:text-[#6e6e6e] pl-9 pr-3 py-2 text-sm outline-none focus:border-[#00a0d1] transition-colors"
            />
          </div>
          <span className="text-sm text-[#6e6e6e]">{filtered.length} reunión(es)</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-[#242424] rounded-xl border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#242424] border border-white/10 flex items-center justify-center">
              <Video className="w-8 h-8 text-[#6e6e6e]" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Sin reuniones</p>
              <p className="text-[#6e6e6e] text-sm mt-1">Crea tu primera reunión para comenzar</p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Crear reunión
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      <CreateMeetingModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(m) => { setMeetings((prev) => [m, ...prev]); setShowCreate(false); }}
      />
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number;
  color: "green" | "blue" | "gray";
}) {
  const bg = { green: "bg-[#27ae60]/10", blue: "bg-[#00a0d1]/10", gray: "bg-[#6e6e6e]/10" }[color];
  return (
    <div className="bg-[#242424] border border-white/10 rounded-xl p-4">
      <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-[#6e6e6e] mt-0.5">{label}</p>
    </div>
  );
}
