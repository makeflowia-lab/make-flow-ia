"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PreJoinLobby } from "@/features/meetings/components/PreJoinLobby";
import { MeetingRoom } from "@/features/meetings/components/MeetingRoom";
import type { Meeting } from "@/shared/types";

type Stage = "loading" | "lobby" | "room" | "error";

interface RoomCredentials {
  token: string;
  serverUrl: string;
}

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const [stage, setStage] = useState<Stage>("loading");
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [credentials, setCredentials] = useState<RoomCredentials | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMeeting() {
      try {
        const res = await fetch(`/api/meetings/${meetingId}`);
        if (!res.ok) { setError("Reunión no encontrada"); setStage("error"); return; }
        const data = await res.json();
        setMeeting(data.data);
        setStage("lobby");
      } catch {
        setError("Error cargando la reunión");
        setStage("error");
      }
    }
    loadMeeting();
  }, [meetingId]);

  async function handleJoin() {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/token`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error obteniendo token");
        setStage("error");
        return;
      }
      const data = await res.json();
      setCredentials({ token: data.data.token, serverUrl: data.data.serverUrl });
      setStage("room");
    } catch {
      setError("Error conectando a la sala");
      setStage("error");
    }
  }

  if (stage === "loading") {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00a0d1] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#b3b3b3] text-sm">Cargando reunión...</p>
        </div>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#e74c3c] text-lg font-medium mb-2">Error</p>
          <p className="text-[#b3b3b3] text-sm mb-6">{error}</p>
          <button onClick={() => router.push("/dashboard")} className="text-[#00a0d1] hover:underline text-sm">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (stage === "lobby" && meeting) {
    return (
      <PreJoinLobby
        meetingTitle={meeting.title}
        onJoin={handleJoin}
        onBack={() => router.push("/dashboard")}
      />
    );
  }

  if (stage === "room" && credentials && meeting) {
    return (
      <MeetingRoom
        token={credentials.token}
        serverUrl={credentials.serverUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || ""}
        meetingTitle={meeting.title}
        meetingId={meetingId}
      />
    );
  }

  return null;
}
