import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Contraseña debe tener al menos 8 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export const createMeetingSchema = z.object({
  title: z.string().min(3, "Título debe tener al menos 3 caracteres").max(100),
  description: z.string().max(500).optional(),
  starts_at: z.string().optional(),
  max_participants: z.number().int().min(2).max(200).default(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
