"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic, MicOff, Video, VideoOff, ChevronLeft, Settings,
  ChevronDown
} from "lucide-react";
import { Button } from "@/shared/components/ui/Button";

interface PreJoinLobbyProps {
  meetingTitle: string;
  onJoin: (audioEnabled: boolean, videoEnabled: boolean) => void;
  onBack: () => void;
}

export function PreJoinLobby({ meetingTitle, onJoin, onBack }: PreJoinLobbyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Ref para poder detener tracks desde el cleanup aunque stream sea stale en el closure
  const streamRef = useRef<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<{ mics: MediaDeviceInfo[]; cameras: MediaDeviceInfo[] }>({
    mics: [],
    cameras: [],
  });
  const [showMicMenu, setShowMicMenu] = useState(false);
  const [showCamMenu, setShowCamMenu] = useState(false);
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [selectedCam, setSelectedCam] = useState<string>("");
  const [mediaError, setMediaError] = useState<string>("");

  useEffect(() => {
    async function initMedia() {
      // Intentar cámara y micrófono por separado para mayor compatibilidad
      let videoStream: MediaStream | null = null;
      let audioStream: MediaStream | null = null;

      try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err: unknown) {
        setIsVideoOff(true);
        const name = err instanceof Error ? err.name : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setMediaError("Permiso de cámara denegado. Habilítalo en la configuración del navegador.");
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setMediaError("No se encontró ninguna cámara en este dispositivo.");
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          setMediaError("La cámara está en uso por otra aplicación.");
        } else {
          setMediaError("No se pudo acceder a la cámara.");
        }
      }

      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setIsMuted(true);
      }

      // Combinar tracks en un solo stream
      const combined = new MediaStream();
      videoStream?.getVideoTracks().forEach((t) => combined.addTrack(t));
      audioStream?.getAudioTracks().forEach((t) => combined.addTrack(t));

      if (combined.getTracks().length > 0) {
        streamRef.current = combined;
        setStream(combined);
        if (videoRef.current && videoStream) {
          videoRef.current.srcObject = combined;
        }
      }

      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const mics = allDevices.filter((d) => d.kind === "audioinput");
        const cameras = allDevices.filter((d) => d.kind === "videoinput");
        setDevices({ mics, cameras });
        if (mics[0]) setSelectedMic(mics[0].deviceId);
        if (cameras[0]) setSelectedCam(cameras[0].deviceId);
      } catch { /* sin permisos para listar dispositivos */ }
    }
    initMedia();
    // Cleanup con ref para que siempre tenga el stream real (no el stale del closure)
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // Reasignar srcObject si el elemento de video se remonta
  useEffect(() => {
    if (stream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (stream) {
      stream.getVideoTracks().forEach((t) => (t.enabled = !isVideoOff));
    }
  }, [isVideoOff, stream]);

  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach((t) => (t.enabled = !isMuted));
    }
  }, [isMuted, stream]);

  async function switchDevice(kind: "audioinput" | "videoinput", deviceId: string) {
    if (!streamRef.current) return;
    const constraints: MediaStreamConstraints =
      kind === "audioinput"
        ? { audio: { deviceId: { exact: deviceId } }, video: false }
        : { video: { deviceId: { exact: deviceId } }, audio: false };
    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const [newTrack] = newStream.getTracks();
      const oldTracks = kind === "audioinput"
        ? streamRef.current.getAudioTracks()
        : streamRef.current.getVideoTracks();
      oldTracks.forEach((t) => { streamRef.current?.removeTrack(t); t.stop(); });
      streamRef.current.addTrack(newTrack);
      if (kind === "videoinput" && videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      if (kind === "audioinput") setSelectedMic(deviceId);
      else setSelectedCam(deviceId);
    } catch { /* dispositivo no disponible */ }
  }

  function handleJoin() {
    // Detener tracks aquí para liberar la cámara antes de que LiveKit la solicite
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onJoin(!isMuted, !isVideoOff);
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center px-4 py-3 border-b border-white/10">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" />
          Atrás
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
        <h1 className="text-xl font-semibold text-white">{meetingTitle}</h1>

        {/* Camera preview */}
        <div className="relative w-full max-w-lg aspect-video bg-[#242424] rounded-xl overflow-hidden border border-white/10">
          {/* El <video> siempre está en el DOM para que srcObject no se pierda al re-activar */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? "invisible" : ""}`}
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#00a0d1] flex items-center justify-center">
                <span className="text-2xl font-semibold text-white">U</span>
              </div>
              {mediaError && (
                <p className="text-xs text-[#e74c3c] text-center px-4 max-w-xs">{mediaError}</p>
              )}
            </div>
          )}
          <div className="absolute bottom-3 right-3 text-xs text-[#b3b3b3] bg-black/50 px-2 py-1 rounded">
            Vista previa
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Mute button */}
          <div className="relative">
            <div className="flex items-center rounded-full border border-white/10 overflow-hidden">
              <Button
                variant={isMuted ? "danger" : "secondary"}
                className="rounded-none !rounded-l-full border-0 gap-2"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isMuted ? "Activar" : "Silenciar"}
              </Button>
              <button
                onClick={() => { setShowMicMenu(!showMicMenu); setShowCamMenu(false); }}
                className="px-2 py-2 bg-[#2d2d2d] hover:bg-[#383838] text-[#b3b3b3] border-l border-white/10"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            {showMicMenu && devices.mics.length > 0 && (
              <div className="absolute bottom-12 left-0 z-20 bg-[#2d2d2d] border border-white/10 rounded-xl shadow-xl py-1 min-w-[220px] animate-fade-in">
                <p className="px-3 py-1.5 text-xs font-semibold text-[#6e6e6e] uppercase tracking-wider">Micrófono</p>
                {devices.mics.map((mic) => (
                  <button
                    key={mic.deviceId}
                    onClick={() => { switchDevice("audioinput", mic.deviceId); setShowMicMenu(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-white/10 ${
                      selectedMic === mic.deviceId ? "text-[#00a0d1]" : "text-white"
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{mic.label || `Micrófono ${mic.deviceId.slice(0, 6)}`}</span>
                    {selectedMic === mic.deviceId && <span className="ml-auto text-[#00a0d1]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Video button */}
          <div className="relative">
            <div className="flex items-center rounded-full border border-white/10 overflow-hidden">
              <Button
                variant={isVideoOff ? "danger" : "secondary"}
                className="rounded-none !rounded-l-full border-0 gap-2"
                onClick={() => setIsVideoOff(!isVideoOff)}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                {isVideoOff ? "Activar vídeo" : "Detener vídeo"}
              </Button>
              <button
                onClick={() => { setShowCamMenu(!showCamMenu); setShowMicMenu(false); }}
                className="px-2 py-2 bg-[#2d2d2d] hover:bg-[#383838] text-[#b3b3b3] border-l border-white/10"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            {showCamMenu && devices.cameras.length > 0 && (
              <div className="absolute bottom-12 left-0 z-20 bg-[#2d2d2d] border border-white/10 rounded-xl shadow-xl py-1 min-w-[220px] animate-fade-in">
                <p className="px-3 py-1.5 text-xs font-semibold text-[#6e6e6e] uppercase tracking-wider">Cámara</p>
                {devices.cameras.map((cam) => (
                  <button
                    key={cam.deviceId}
                    onClick={() => { switchDevice("videoinput", cam.deviceId); setShowCamMenu(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-white/10 ${
                      selectedCam === cam.deviceId ? "text-[#00a0d1]" : "text-white"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{cam.label || `Cámara ${cam.deviceId.slice(0, 6)}`}</span>
                    {selectedCam === cam.deviceId && <span className="ml-auto text-[#00a0d1]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Join button */}
          <Button onClick={handleJoin} size="md" className="px-8 rounded-full">
            Iniciar reunión
          </Button>
        </div>

        {/* Device info */}
        {(devices.mics.length > 0 || devices.cameras.length > 0) && (
          <p className="text-xs text-[#6e6e6e] flex items-center gap-1">
            <Settings className="w-3 h-3" />
            {devices.cameras.length} cámara(s) · {devices.mics.length} micrófono(s) detectado(s)
          </p>
        )}
      </div>
    </div>
  );
}
