"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Video } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al registrarse");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#00a0d1] rounded-2xl flex items-center justify-center mb-4">
            <Video className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Make Flow IA</h1>
          <p className="text-[#b3b3b3] text-sm mt-1">Crear cuenta nueva</p>
        </div>

        <div className="bg-[#242424] rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Registro</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-[#e74c3c]/10 border border-[#e74c3c]/30 rounded-lg text-sm text-[#e74c3c]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Nombre completo"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan García"
              icon={<User className="w-4 h-4" />}
              required
            />
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              icon={<Lock className="w-4 h-4" />}
              required
            />
            <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
              Crear cuenta
            </Button>
          </form>
        </div>

        <p className="text-center text-[#6e6e6e] text-sm mt-4">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-[#00a0d1] hover:underline">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
