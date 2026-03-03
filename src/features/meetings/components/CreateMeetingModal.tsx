"use client";

import { useState } from "react";
import { Modal } from "@/shared/components/ui/Modal";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import type { Meeting } from "@/shared/types";

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (meeting: Meeting) => void;
}

export function CreateMeetingModal({ isOpen, onClose, onCreated }: CreateMeetingModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(200);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, max_participants: maxParticipants }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear reunión");
        return;
      }

      onCreated(data.data);
      setTitle("");
      setDescription("");
      onClose();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva reunión">
      {error && (
        <div className="mb-4 px-3 py-2.5 bg-[#e74c3c]/10 border border-[#e74c3c]/30 rounded-lg text-sm text-[#e74c3c]">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Título de la reunión"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Reunión de equipo"
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#b3b3b3]">Descripción (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agenda de la reunión..."
            rows={3}
            className="w-full bg-[#2d2d2d] border border-white/10 rounded-lg text-white placeholder:text-[#6e6e6e] px-3 py-2.5 text-sm outline-none transition-all focus:border-[#00a0d1] focus:ring-1 focus:ring-[#00a0d1] resize-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#b3b3b3]">
            Máximo participantes: <span className="text-white">{maxParticipants}</span>
          </label>
          <input
            type="range"
            min={2}
            max={200}
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(Number(e.target.value))}
            className="accent-[#00a0d1] w-full"
          />
          <div className="flex justify-between text-xs text-[#6e6e6e]">
            <span>2</span>
            <span>200</span>
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Crear reunión
          </Button>
        </div>
      </form>
    </Modal>
  );
}
