"use client";

import { useRouter } from "next/navigation";
import { Video, Users, Clock, MoreHorizontal, Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import type { Meeting } from "@/shared/types";

interface MeetingCardProps {
  meeting: Meeting;
  onDelete: (id: string) => void;
}

export function MeetingCard({ meeting, onDelete }: MeetingCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const statusLabel = {
    active: "En curso",
    scheduled: "Programada",
    ended: "Finalizada",
  }[meeting.status];

  const badgeVariant = meeting.status as "active" | "scheduled" | "ended";

  function formatDate(dateStr?: string) {
    if (!dateStr) return "Sin fecha";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function copyLink() {
    const url = `${window.location.origin}/meetings/${meeting.id}`;
    navigator.clipboard.writeText(url);
  }

  return (
    <div className="bg-[#242424] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            meeting.status === "active" ? "bg-[#27ae60]/20" : "bg-[#00a0d1]/20"
          }`}>
            <Video className={`w-5 h-5 ${meeting.status === "active" ? "text-[#27ae60]" : "text-[#00a0d1]"}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-white truncate text-sm">{meeting.title}</h3>
            <p className="text-xs text-[#6e6e6e] mt-0.5">
              {meeting.host_name && `Anfitrión: ${meeting.host_name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={badgeVariant}>{statusLabel}</Badge>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="!p-1.5 opacity-40 group-hover:opacity-100"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 top-8 z-10 bg-[#2d2d2d] border border-white/10 rounded-lg shadow-xl w-44 py-1 animate-fade-in">
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                  onClick={() => { copyLink(); setShowMenu(false); }}
                >
                  <Copy className="w-4 h-4 text-[#6e6e6e]" />
                  Copiar enlace
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#e74c3c] hover:bg-white/10 transition-colors"
                  onClick={() => { onDelete(meeting.id); setShowMenu(false); }}
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center gap-4 text-xs text-[#6e6e6e] mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {meeting.participant_count ?? 0} / {meeting.max_participants}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(meeting.starts_at || meeting.created_at)}
        </span>
      </div>

      {/* Actions */}
      {meeting.status !== "ended" && (
        <Button
          variant={meeting.status === "active" ? "primary" : "secondary"}
          size="sm"
          className="w-full"
          onClick={() => router.push(`/meetings/${meeting.id}`)}
        >
          {meeting.status === "active" ? "Unirse ahora" : "Iniciar reunión"}
        </Button>
      )}
    </div>
  );
}
