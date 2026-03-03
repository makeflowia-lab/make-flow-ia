import type { Metadata } from "next";
import "./globals.css";
import "@livekit/components-styles";

export const metadata: Metadata = {
  title: "Make Flow IA - Videoconferencias",
  description: "Plataforma de videoconferencias empresarial para 200+ usuarios",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
