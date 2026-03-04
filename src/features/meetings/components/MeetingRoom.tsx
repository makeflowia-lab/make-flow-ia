"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  LayoutContextProvider,
  RoomAudioRenderer,
  GridLayout,
  ParticipantTile,
  useTracks,
  useDataChannel,
  useLocalParticipant,
  useParticipants,
  useChat,
  useConnectionState,
} from "@livekit/components-react";
import { Track, ConnectionState } from "livekit-client";
import {
  ChevronLeft,
  LayoutGrid,
  Info,
  Copy,
  Users,
  Grid3x3,
  Rows3,
  Columns2,
  X,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Lock,
  Unlock,
  MessageSquareWarning,
  Settings2,
  LogOut,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ChevronDown,
  Monitor,
  MonitorOff,
  MessageSquare,
  Hand,
  Smile,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import type { LayoutMode } from "../types";

interface MeetingRoomProps {
  token: string;
  serverUrl: string;
  meetingTitle: string;
  meetingId: string;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
}

// ─── Panel lateral - Diseño ───────────────────────────────────────────────────
function DesignPanel({
  layout,
  onLayoutChange,
  onClose,
  hideNames,
  setHideNames,
}: {
  layout: LayoutMode;
  onLayoutChange: (l: LayoutMode) => void;
  onClose: () => void;
  hideNames: boolean;
  setHideNames: (v: boolean) => void;
}) {
  const [fullscreen, setFullscreen] = useState(false);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  }

  const layouts: { id: LayoutMode; icon: React.ReactNode; label: string }[] = [
    { id: "grid", icon: <Grid3x3 className="w-5 h-5" />, label: "Cuadrícula" },
    { id: "grouped", icon: <Rows3 className="w-5 h-5" />, label: "Agrupado" },
    {
      id: "side-by-side",
      icon: <Columns2 className="w-5 h-5" />,
      label: "Uno junto a otro",
    },
  ];

  return (
    <div className="w-72 bg-[#242424] border-l border-white/10 flex flex-col animate-slide-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-semibold text-white">Diseño</span>
        <Button variant="ghost" size="sm" onClick={onClose} className="!p-1">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {layouts.map((l) => (
            <button
              key={l.id}
              onClick={() => onLayoutChange(l.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                layout === l.id
                  ? "border-[#00a0d1] bg-[#00a0d1]/10 text-[#00a0d1]"
                  : "border-white/10 text-[#b3b3b3] hover:border-white/20 hover:bg-white/5"
              }`}
            >
              {l.icon}
              <span className="text-xs text-center leading-tight">
                {l.label}
              </span>
            </button>
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#6e6e6e] uppercase tracking-wider mb-2">
            Opciones de diseño
          </p>
          <div
            className="flex items-center justify-between py-2 cursor-pointer"
            onClick={toggleFullscreen}
          >
            <span className="text-sm text-white">
              Vista de pantalla completa
            </span>
            {fullscreen ? (
              <ToggleRight className="w-8 h-8 text-[#00a0d1]" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-[#6e6e6e]" />
            )}
          </div>
          <div
            className="flex items-center justify-between py-2 cursor-pointer"
            onClick={() => setHideNames(!hideNames)}
          >
            <span className="text-sm text-white">
              Ocultar nombres automáticamente
            </span>
            {hideNames ? (
              <ToggleRight className="w-8 h-8 text-[#00a0d1]" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-[#6e6e6e]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel lateral - Invitar / Participantes ──────────────────────────────────
function InvitePanel({
  meetingId,
  meetingTitle,
  onClose,
}: {
  meetingId: string;
  meetingTitle: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const meetingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/meetings/${meetingId}`
      : "";

  function copyLink() {
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendInvite() {
    if (!email.trim() || sending) return;
    setSending(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/meetings/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          meetingTitle,
          meetingUrl,
          senderName: "Un participante",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Error al enviar");
      } else {
        setSent(true);
        setEmail("");
        setTimeout(() => setSent(false), 3000);
      }
    } catch {
      setErrorMsg("Error de red al enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="w-80 bg-[#242424] border-l border-white/10 flex flex-col animate-slide-in">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <span className="text-sm font-semibold text-white flex-1">
          Invitar a personas
        </span>
        <Button variant="ghost" size="sm" onClick={onClose} className="!p-1">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4 space-y-3">
        {sent && (
          <div className="px-3 py-2 bg-green-500/15 border border-green-500/30 rounded-lg text-sm text-green-400">
            ✓ Invitación enviada correctamente
          </div>
        )}
        {errorMsg && (
          <div className="px-3 py-2 bg-red-500/15 border border-red-500/30 rounded-lg text-sm text-red-400">
            {errorMsg}
          </div>
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendInvite()}
          placeholder="Correo electrónico"
          type="email"
          className="w-full bg-[#2d2d2d] border border-white/10 rounded-lg text-white placeholder:text-[#6e6e6e] px-3 py-2 text-sm outline-none focus:border-[#00a0d1]"
        />
        <Button
          variant="secondary"
          className="w-full"
          disabled={!email.trim() || sending}
          onClick={sendInvite}
        >
          {sending ? "Enviando…" : "Invitar"}
        </Button>
        <div className="pt-2 border-t border-white/10 space-y-1">
          <p className="text-xs text-[#6e6e6e] px-1">
            O comparte el enlace directamente:
          </p>
          <button
            onClick={copyLink}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
          >
            <Copy className="w-4 h-4 text-[#6e6e6e]" />
            {copied ? "¡Enlace copiado!" : "Copiar enlace de meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Menú de más opciones ─────────────────────────────────────────────────────
function MoreOptionsMenu({
  meetingId,
  onClose,
  onLeave,
}: {
  meetingId: string;
  onClose: () => void;
  onLeave: () => void;
}) {
  const [locked, setLocked] = useState(false);
  const [breakrooms, setBreakrooms] = useState(false);
  const [notice, setNotice] = useState("");

  function showNotice(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3000);
  }

  function copyLink() {
    const url = `${window.location.origin}/meetings/${meetingId}`;
    navigator.clipboard.writeText(url);
    showNotice("¡Enlace copiado!");
  }

  function openWhiteboard() {
    const key = btoa(meetingId)
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 20);
    window.open(`https://excalidraw.com/#room=${meetingId},${key}`, "_blank");
    onClose();
  }

  function toggleLock() {
    const next = !locked;
    setLocked(next);
    showNotice(
      next
        ? "Meeting bloqueado — nuevos participantes no pueden unirse"
        : "Meeting desbloqueado",
    );
  }

  function toggleBreakrooms() {
    const next = !breakrooms;
    setBreakrooms(next);
    showNotice(
      next
        ? "Sesiones de grupos habilitadas"
        : "Sesiones de grupos deshabilitadas",
    );
  }

  function reportProblem() {
    const subject = encodeURIComponent(`Problema en reunión ${meetingId}`);
    const body = encodeURIComponent(
      `Hola, encontré un problema en la reunión ${meetingId}.\n\nDescripción:\n`,
    );
    window.open(
      `mailto:soporte@makeflowia.com?subject=${subject}&body=${body}`,
      "_blank",
    );
    onClose();
  }

  function openSettings() {
    showNotice("Abriendo opciones de meeting…");
    setTimeout(onClose, 1500);
  }

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 bg-[#2d2d2d] border border-white/10 rounded-xl shadow-2xl w-64 py-1 animate-fade-in">
      <div className="px-3 py-1.5">
        <p className="text-xs font-semibold text-[#6e6e6e] uppercase tracking-wider">
          meeting
        </p>
      </div>

      {notice && (
        <div className="mx-3 mb-1 px-3 py-2 bg-[#00a0d1]/15 border border-[#00a0d1]/30 rounded-lg text-xs text-[#00a0d1]">
          {notice}
        </div>
      )}

      <button
        onClick={copyLink}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
      >
        <Copy className="w-4 h-4 text-[#6e6e6e]" />
        Copiar enlace de meeting
      </button>
      <button
        onClick={openWhiteboard}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
      >
        <Pencil className="w-4 h-4 text-[#6e6e6e]" />
        Iniciar una nueva pizarra
      </button>
      <button
        onClick={toggleLock}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
      >
        {locked ? (
          <Lock className="w-4 h-4 text-[#6e6e6e]" />
        ) : (
          <Unlock className="w-4 h-4 text-[#6e6e6e]" />
        )}
        <span className="flex-1 text-left">Bloquear meeting</span>
        <div
          className={`w-7 h-4 rounded-full transition-colors ${locked ? "bg-[#00a0d1]" : "bg-[#6e6e6e]"}`}
        >
          <div
            className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${locked ? "translate-x-3.5" : "translate-x-0.5"}`}
          />
        </div>
      </button>
      <button
        onClick={toggleBreakrooms}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
      >
        <Users className="w-4 h-4 text-[#6e6e6e]" />
        <span className="flex-1 text-left">Habilitar sesión de grupos</span>
        <div
          className={`w-7 h-4 rounded-full transition-colors ${breakrooms ? "bg-[#00a0d1]" : "bg-[#6e6e6e]"}`}
        >
          <div
            className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${breakrooms ? "translate-x-3.5" : "translate-x-0.5"}`}
          />
        </div>
      </button>
      <button
        onClick={reportProblem}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
      >
        <MessageSquareWarning className="w-4 h-4 text-[#6e6e6e]" />
        Informar de un problema
      </button>
      <button
        onClick={openSettings}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
      >
        <Settings2 className="w-4 h-4 text-[#6e6e6e]" />
        Opciones de Meeting
      </button>
      <div className="border-t border-white/10 mt-1">
        <button
          onClick={onLeave}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#e74c3c] hover:bg-white/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Salir de la reunión
        </button>
      </div>
    </div>
  );
}

// ─── Emojis flotantes ─────────────────────────────────────────────────────────
interface ActiveEmoji {
  id: string;
  emoji: string;
  x: number;
}

function FloatingEmojiLayer({ emojis }: { emojis: ActiveEmoji[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {emojis.map((e) => (
        <span
          key={e.id}
          className="absolute bottom-24 text-5xl animate-float-up select-none"
          style={{ left: `${e.x}%` }}
        >
          {e.emoji}
        </span>
      ))}
    </div>
  );
}

// ─── Notificaciones de mano levantada ─────────────────────────────────────────
function HandRaisedOverlay() {
  const participants = useParticipants();
  const raised = participants.filter(
    (p) => p.attributes?.handRaised === "true",
  );

  if (raised.length === 0) return null;

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5">
      {raised.map((p) => (
        <div
          key={p.sid}
          className="flex items-center gap-2 bg-[#2d2d2d] border border-white/10 rounded-full px-4 py-1.5 animate-fade-in shadow-lg"
        >
          <span className="text-base">✋</span>
          <span className="text-sm text-white font-medium">
            {p.name || p.identity} levantó la mano
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Barra de reacciones ──────────────────────────────────────────────────────
const REACTIONS = ["👍", "❤️", "😂", "😮", "👏", "🎉"];

function ReactionsBar({
  onSend,
  onClose,
}: {
  onSend: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 bg-[#2d2d2d] border border-white/10 rounded-2xl shadow-2xl px-3 py-2 flex items-center gap-1 animate-fade-in">
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSend(emoji);
            onClose();
          }}
          className="text-2xl p-1.5 rounded-xl hover:bg-white/10 transition-all hover:scale-125"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// ─── Barra de controles ───────────────────────────────────────────────────────
function MeetingControlBar({
  meetingId,
  meetingTitle,
  onLeave,
  layout,
  onLayoutChange,
  showDesign,
  setShowDesign,
  showInvite,
  setShowInvite,
  showChat,
  setShowChat,
  hideNames,
  setHideNames,
}: {
  meetingId: string;
  meetingTitle: string;
  onLeave: () => void;
  layout: LayoutMode;
  onLayoutChange: (l: LayoutMode) => void;
  showDesign: boolean;
  setShowDesign: (v: boolean) => void;
  showInvite: boolean;
  setShowInvite: (v: boolean) => void;
  showChat: boolean;
  setShowChat: (v: boolean) => void;
  hideNames: boolean;
  setHideNames: (v: boolean) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<ActiveEmoji[]>([]);
  const [showMicMenu, setShowMicMenu] = useState(false);
  const [showCamMenu, setShowCamMenu] = useState(false);
  const [devices, setDevices] = useState<{ mics: MediaDeviceInfo[]; cameras: MediaDeviceInfo[] }>({ mics: [], cameras: [] });

  // Enumerar dispositivos al montar
  useEffect(() => {
    async function loadDevices() {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices({
          mics: all.filter((d) => d.kind === "audioinput"),
          cameras: all.filter((d) => d.kind === "videoinput"),
        });
      } catch { /* sin permisos */ }
    }
    loadDevices();
    navigator.mediaDevices.addEventListener("devicechange", loadDevices);
    return () => navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
  }, []);

  function addFloatingEmoji(emoji: string) {
    const id = Math.random().toString(36).slice(2);
    const x = 8 + Math.random() * 78;
    setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);
    setTimeout(
      () => setFloatingEmojis((prev) => prev.filter((e) => e.id !== id)),
      2400,
    );
  }

  const { send } = useDataChannel("reactions", (msg) => {
    try {
      const { emoji } = JSON.parse(new TextDecoder().decode(msg.payload));
      addFloatingEmoji(emoji);
    } catch {
      // mensaje malformado, ignorar
    }
  });

  function sendReaction(emoji: string) {
    try {
      send(new TextEncoder().encode(JSON.stringify({ emoji })), {
        reliable: false,
      });
    } catch {
      // sin conexión aún, ignorar
    }
    addFloatingEmoji(emoji);
  }

  const { localParticipant } = useLocalParticipant();

  function toggleHand() {
    const next = !handRaised;
    setHandRaised(next);
    try {
      localParticipant.setAttributes({ handRaised: next ? "true" : "" });
    } catch {
      // sin conexión aún, ignorar
    }
  }

  async function switchMic(deviceId: string) {
    try {
      await localParticipant.setMicrophoneEnabled(true, { deviceId: { exact: deviceId } });
    } catch { /* dispositivo no disponible */ }
    setShowMicMenu(false);
  }

  async function switchCam(deviceId: string) {
    try {
      await localParticipant.setCameraEnabled(true, { deviceId: { exact: deviceId } });
    } catch { /* dispositivo no disponible */ }
    setShowCamMenu(false);
  }

  return (
    <>
      {/* Emojis flotantes — absolute sobre toda la sala */}
      <FloatingEmojiLayer emojis={floatingEmojis} />

      {/* Notificaciones de mano levantada */}
      <HandRaisedOverlay />

      {/* Panels laterales */}
      <div className="absolute top-0 right-0 h-full flex z-20">
        {showDesign && (
          <DesignPanel
            layout={layout}
            onLayoutChange={onLayoutChange}
            onClose={() => setShowDesign(false)}
            hideNames={hideNames}
            setHideNames={setHideNames}
          />
        )}
        {showInvite && (
          <InvitePanel
            meetingId={meetingId}
            meetingTitle={meetingTitle}
            onClose={() => setShowInvite(false)}
          />
        )}
      </div>

      {/* Menú de más opciones */}
      {showMore && (
        <MoreOptionsMenu
          meetingId={meetingId}
          onClose={() => setShowMore(false)}
          onLeave={onLeave}
        />
      )}

      {/* Selector de reacciones */}
      {showReactions && (
        <ReactionsBar
          onSend={sendReaction}
          onClose={() => setShowReactions(false)}
        />
      )}

      {/* Barra de subtítulos */}
      {showSubtitles && (
        <div className="absolute bottom-16 left-4 z-40 bg-[#242424] border border-white/10 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
          <span className="text-sm text-white">
            Subtitulado en tiempo real no disponible
          </span>
          <button onClick={() => setShowSubtitles(false)}>
            <X className="w-4 h-4 text-[#6e6e6e]" />
          </button>
        </div>
      )}

      {/* Barra de control inferior */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-[#1a1a1a]/95 border-t border-white/10 backdrop-blur-md z-10">
        {/* Izquierda: Info de la Reunión */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col">
            <span className="text-xs text-[#6e6e6e] font-medium uppercase tracking-widest">En directo</span>
            <span className="text-sm font-semibold text-white">{meetingTitle}</span>
          </div>
        </div>

        {/* Centro: Controles Principales */}
        <div className="flex items-center gap-3">
          {/* Micrófono con selector de dispositivo custom */}
          <div className="relative">
            <div className="flex items-center rounded-xl bg-[#2d2d2d] border border-white/10 overflow-hidden shadow-lg">
              <button
                onClick={() => localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled)}
                title={localParticipant.isMicrophoneEnabled ? "Silenciar" : "Activar micrófono"}
                className={`px-4 py-2 flex items-center justify-center hover:bg-white/10 transition-all border-r border-white/10 ${
                  !localParticipant.isMicrophoneEnabled ? "text-[#e74c3c]" : "text-white"
                }`}
              >
                {localParticipant.isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => { setShowMicMenu(!showMicMenu); setShowCamMenu(false); }}
                className="px-2 py-2 hover:bg-white/10 transition-colors text-[#b3b3b3] cursor-pointer"
                title="Seleccionar micrófono"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            {showMicMenu && devices.mics.length > 0 && (
              <div className="absolute bottom-12 left-0 z-50 bg-[#2d2d2d] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[260px] animate-fade-in">
                <p className="px-3 py-1.5 text-xs font-semibold text-[#6e6e6e] uppercase tracking-wider">Micrófono</p>
                {devices.mics.map((mic) => (
                  <button
                    key={mic.deviceId}
                    onClick={() => switchMic(mic.deviceId)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-white/10 text-white"
                  >
                    <Mic className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{mic.label || `Micrófono ${mic.deviceId.slice(0, 6)}`}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cámara con selector de dispositivo custom */}
          <div className="relative">
            <div className="flex items-center rounded-xl bg-[#2d2d2d] border border-white/10 overflow-hidden shadow-lg">
              <button
                onClick={() => localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled)}
                title={localParticipant.isCameraEnabled ? "Detener video" : "Activar cámara"}
                className={`px-4 py-2 flex items-center justify-center hover:bg-white/10 transition-all border-r border-white/10 ${
                  !localParticipant.isCameraEnabled ? "text-[#e74c3c]" : "text-white"
                }`}
              >
                {localParticipant.isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => { setShowCamMenu(!showCamMenu); setShowMicMenu(false); }}
                className="px-2 py-2 hover:bg-white/10 transition-colors text-[#b3b3b3] cursor-pointer"
                title="Seleccionar cámara"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            {showCamMenu && devices.cameras.length > 0 && (
              <div className="absolute bottom-12 left-0 z-50 bg-[#2d2d2d] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[260px] animate-fade-in">
                <p className="px-3 py-1.5 text-xs font-semibold text-[#6e6e6e] uppercase tracking-wider">Cámara</p>
                {devices.cameras.map((cam) => (
                  <button
                    key={cam.deviceId}
                    onClick={() => switchCam(cam.deviceId)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-white/10 text-white"
                  >
                    <Video className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{cam.label || `Cámara ${cam.deviceId.slice(0, 6)}`}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compartir Pantalla */}
          <button
            onClick={() => localParticipant.setScreenShareEnabled(!localParticipant.isScreenShareEnabled)}
            title="Compartir pantalla"
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 shadow-lg ${
              localParticipant.isScreenShareEnabled
                ? "bg-[#00a0d1]/20 border-[#00a0d1] text-[#00a0d1]"
                : "bg-[#2d2d2d] border-white/10 text-white hover:bg-[#383838]"
            }`}
          >
            {localParticipant.isScreenShareEnabled ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            <span className="text-xs font-bold hidden md:inline">Presentar</span>
          </button>

          {/* Chat */}
          <button
            onClick={() => { setShowChat(!showChat); setShowMore(false); setShowReactions(false); }}
            title="Chat"
            className={`p-2.5 rounded-xl border transition-all shadow-lg ${
              showChat
                ? "bg-[#00a0d1]/20 border-[#00a0d1] text-[#00a0d1]"
                : "bg-[#2d2d2d] border-white/10 text-white hover:bg-[#383838]"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Reacciones y otros agrupados */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1 bg-white/5 rounded-2xl border border-white/5">
            <button
              onClick={toggleHand}
              title={handRaised ? "Bajar mano" : "Levantar mano"}
              className={`p-1.5 transition-all ${handRaised ? "text-[#f39c12] scale-125" : "text-[#b3b3b3] hover:text-white"}`}
            >
              <Hand className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setShowReactions(!showReactions); setShowMore(false); }}
              title="Reacciones"
              className="p-1.5 text-[#b3b3b3] hover:text-white transition-all"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setShowMore(!showMore); setShowReactions(false); }}
              title="Más opciones"
              className="p-1.5 text-[#b3b3b3] hover:text-white transition-all"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Salir */}
          <button
            onClick={onLeave}
            title="Finalizar"
            className="w-11 h-11 rounded-2xl bg-[#e74c3c] hover:bg-[#c0392b] flex items-center justify-center transition-all shadow-lg shadow-red-900/20 active:scale-95 ml-2"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Derecha: Layout e Info */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDesign(!showDesign)}
            className={`p-2 rounded-xl border transition-all ${
              showDesign ? "bg-white/10 border-white/20 text-white" : "border-transparent text-[#6e6e6e] hover:text-white"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className={`p-2 rounded-xl border transition-all ${
              showInvite ? "bg-white/10 border-white/20 text-white" : "border-transparent text-[#6e6e6e] hover:text-white"
            }`}
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Panel de chat ────────────────────────────────────────────────────────────
function ChatPanel({ onClose }: { onClose: () => void }) {
  const { chatMessages, send, isSending } = useChat();
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function handleSend() {
    if (!message.trim() || isSending) return;
    try {
      await send(message.trim());
      setMessage("");
    } catch (error) {
      console.error("Chat send error:", error);
    }
  }

  return (
    <div className="w-72 bg-[#1e1e1e] border-l border-white/10 flex flex-col shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-semibold text-white">Chat</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-[#b3b3b3] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {chatMessages.length === 0 && (
          <p className="text-xs text-[#6e6e6e] text-center pt-4">
            Aún no hay mensajes. ¡Sé el primero!
          </p>
        )}
        {chatMessages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-0.5">
            <span className="text-xs text-[#00a0d1] font-medium">
              {msg.from?.name || msg.from?.identity || "Anónimo"}
            </span>
            <span className="text-sm text-white bg-[#2d2d2d] rounded-lg px-3 py-1.5 break-words">
              {msg.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="px-3 py-2.5 border-t border-white/10 flex gap-2 items-end">
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribe un mensaje…"
          rows={1}
          className="flex-1 bg-[#2d2d2d] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-[#6e6e6e] outline-none focus:border-[#00a0d1] min-w-0 resize-none overflow-y-auto leading-5"
          style={{ height: "32px" }}
        />
        <button
          onClick={handleSend}
          disabled={isSending || !message.trim()}
          className="px-3 py-1.5 bg-[#00a0d1] hover:bg-[#0090c0] disabled:opacity-40 rounded-lg text-sm text-white transition-colors shrink-0"
        >
          ↑
        </button>
      </div>
    </div>
  );
}

// ─── Banner de estado de conexión ─────────────────────────────────────────────
function ConnectionStatusBanner() {
  const connectionState = useConnectionState();

  if (connectionState === ConnectionState.Connected) return null;

  const labels: Record<string, { text: string; color: string }> = {
    [ConnectionState.Connecting]: { text: "Conectando a la sala…", color: "#f39c12" },
    [ConnectionState.Reconnecting]: { text: "Reconectando…", color: "#f39c12" },
    [ConnectionState.Disconnected]: { text: "Desconectado de la sala", color: "#e74c3c" },
  };

  const info = labels[connectionState] || { text: `Estado: ${connectionState}`, color: "#6e6e6e" };

  return (
    <div
      className="absolute top-12 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg border animate-fade-in"
      style={{ backgroundColor: `${info.color}20`, borderColor: `${info.color}50`, color: info.color }}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: info.color }} />
        <span className="text-sm font-medium">{info.text}</span>
      </div>
    </div>
  );
}

// ─── Grid de video con soporte de layouts ─────────────────────────────────────
function VideoGrid({
  layout,
  hideNames,
}: {
  layout: LayoutMode;
  hideNames: boolean;
}) {
  const connectionState = useConnectionState();
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const hideClass = hideNames ? "lk-hide-names" : "";

  // Mostrar mensaje cuando no hay tracks
  if (tracks.length === 0) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          {connectionState !== ConnectionState.Connected ? (
            <>
              <div className="w-10 h-10 border-2 border-[#00a0d1] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p style={{ color: "#b3b3b3", fontSize: 14 }}>Conectando a la sala…</p>
            </>
          ) : (
            <p style={{ color: "#6e6e6e", fontSize: 14 }}>Esperando participantes…</p>
          )}
        </div>
      </div>
    );
  }

  if (layout === "grouped") {
    const [main, ...rest] = tracks;
    return (
      <div
        className={hideClass}
        style={{
          display: "flex",
          height: "100%",
          gap: 8,
          padding: 8,
        }}
      >
        <div
          style={{
            flex: "0 0 70%",
            borderRadius: 8,
            overflow: "hidden",
            background: "#242424",
          }}
        >
          {main ? (
            <ParticipantTile
              trackRef={main}
              style={{ height: "100%", width: "100%" }}
            />
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#6e6e6e", fontSize: 14 }}>
                Esperando participantes…
              </span>
            </div>
          )}
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            overflowY: "auto",
          }}
        >
          {rest.map((t) => (
            <ParticipantTile
              key={`${t.participant.sid}-${t.source}`}
              trackRef={t}
              style={{ minHeight: 120, borderRadius: 8 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (layout === "side-by-side") {
    return (
      <div
        className={hideClass}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          height: "100%",
          gap: 8,
          padding: 8,
        }}
      >
        {tracks.map((t) => (
          <ParticipantTile
            key={`${t.participant.sid}-${t.source}`}
            trackRef={t}
            style={{ borderRadius: 8 }}
          />
        ))}
      </div>
    );
  }

  // Modo grid (default)
  return (
    <div className={hideClass} style={{ height: "100%", width: "100%" }}>
      <GridLayout tracks={tracks} style={{ height: "100%", width: "100%" }}>
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function MeetingRoom({
  token,
  serverUrl,
  meetingTitle,
  meetingId,
  videoEnabled = true,
  audioEnabled = true,
}: MeetingRoomProps) {
  const router = useRouter();
  const [layout, setLayout] = useState<LayoutMode>("grid");
  const [showDesign, setShowDesign] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [hideNames, setHideNames] = useState(false);

  // Suprimir warnings internos de LiveKit que no afectan funcionalidad
  useEffect(() => {
    const SUPPRESSED = [
      "Abort handler called",
      "Received leave request while trying to",
    ];
    const original = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      const msg = args[0]?.toString() ?? "";
      if (SUPPRESSED.some((s) => msg.includes(s))) return;
      original(...args);
    };
    return () => {
      console.error = original;
    };
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log("MeetingRoom: onDisconnected called");
    router.push("/dashboard");
  }, [router]);

  function copyMeetingLink() {
    const url = `${window.location.origin}/meetings/${meetingId}`;
    navigator.clipboard.writeText(url);
  }

  return (
    <div className="h-screen w-screen bg-[#1a1a1a] flex flex-col overflow-hidden">
      <LiveKitRoom
        key={token}
        video={videoEnabled}
        audio={audioEnabled}
        token={token}
        serverUrl={serverUrl}
        connect={true}
        onConnected={() => console.log("LiveKitRoom: CONNECTED to room")}
        onDisconnected={handleDisconnect}
        onError={(err) => console.error("LiveKitRoom: CONNECTION ERROR", err)}
        data-lk-theme="default"
        className="flex-1 flex flex-col relative"
        style={{ height: "100vh" }}
        options={{ adaptiveStream: true, dynacast: true }}
      >
        <LayoutContextProvider>
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2.5 bg-[#1a1a1a]/80 border-b border-white/10 backdrop-blur-sm">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1 text-sm text-[#b3b3b3] hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Atrás
            </button>

            <span className="text-sm font-medium text-white absolute left-1/2 -translate-x-1/2">
              {meetingTitle}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setShowDesign(!showDesign);
                  setShowInvite(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${showDesign ? "bg-white/20 text-white" : "hover:bg-white/10 text-[#b3b3b3]"}`}
              >
                <LayoutGrid className="w-4 h-4" />
                Diseño
              </button>
              <button
                onClick={() => {
                  setShowInvite(!showInvite);
                  setShowDesign(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${showInvite ? "bg-white/20 text-white" : "hover:bg-white/10 text-[#b3b3b3]"}`}
              >
                <Info className="w-4 h-4" />
                Información
              </button>
              <button
                onClick={copyMeetingLink}
                title="Copiar enlace"
                className="p-1.5 rounded hover:bg-white/10 text-[#b3b3b3] transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                title="Cerrar"
                className="p-1.5 rounded hover:bg-white/10 text-[#b3b3b3] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Estado de conexión */}
          <ConnectionStatusBanner />

          {/* Área de video + panel de chat */}
          <div className="flex-1 pt-11 pb-[80px] flex overflow-hidden">
            <div className="flex-1 relative min-w-0">
              <VideoGrid layout={layout} hideNames={hideNames} />
            </div>
            {showChat && <ChatPanel onClose={() => setShowChat(false)} />}
          </div>

          <RoomAudioRenderer />

          {/* Barra de controles custom */}
          <MeetingControlBar
            meetingId={meetingId}
            meetingTitle={meetingTitle}
            onLeave={handleDisconnect}
            layout={layout}
            onLayoutChange={setLayout}
            showDesign={showDesign}
            setShowDesign={setShowDesign}
            showInvite={showInvite}
            setShowInvite={setShowInvite}
            showChat={showChat}
            setShowChat={setShowChat}
            hideNames={hideNames}
            setHideNames={setHideNames}
          />
        </LayoutContextProvider>
      </LiveKitRoom>
    </div>
  );
}
