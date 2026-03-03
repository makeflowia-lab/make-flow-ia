import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/shared/lib/db";
import { signToken } from "@/shared/lib/jwt";
import { registerSchema } from "@/shared/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if email already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ error: "Este correo ya está registrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${passwordHash}, 'user')
      RETURNING id, name, email, role, created_at
    `;

    const token = await signToken({ sub: user.id, email: user.email, name: user.name, role: user.role });

    const response = NextResponse.json({ data: { user } }, { status: 201 });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
