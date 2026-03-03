import { AuthProvider } from "@/features/auth/components/AuthProvider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
