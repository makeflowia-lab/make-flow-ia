import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/shared/lib/db";
import { signToken } from "@/shared/lib/jwt";
import { loginSchema } from "@/shared/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const { name: displayName } = body as { name?: string };

    const users = await sql`
      SELECT id, name, email, password_hash, role FROM users WHERE email = ${email} LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    // Update display name if provided
    if (displayName && displayName.trim().length >= 2) {
      await sql`UPDATE users SET name = ${displayName.trim()} WHERE id = ${user.id}`;
      user.name = displayName.trim();
    }

    const token = await signToken({ sub: user.id, email: user.email, name: user.name, role: user.role });

    const response = NextResponse.json({
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
