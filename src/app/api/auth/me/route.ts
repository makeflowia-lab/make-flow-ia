import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/shared/lib/jwt";
import { sql } from "@/shared/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    const users = await sql`
      SELECT id, name, email, role, created_at FROM users WHERE id = ${payload.sub} LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ data: { user: users[0] } });
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
