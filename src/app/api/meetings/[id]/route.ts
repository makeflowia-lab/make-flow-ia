import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/shared/lib/jwt";
import { sql } from "@/shared/lib/db";

async function getUser(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) throw new Error("No autenticado");
  return verifyToken(token);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getUser(req);
    const { id } = await params;

    const meetings = await sql`
      SELECT m.*, u.name AS host_name
      FROM meetings m
      LEFT JOIN users u ON u.id = m.host_id
      WHERE m.id = ${id}
      LIMIT 1
    `;

    if (meetings.length === 0) {
      return NextResponse.json({ error: "Reunión no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ data: meetings[0] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg === "No autenticado" ? 401 : 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    const { id } = await params;

    const meetings = await sql`SELECT host_id FROM meetings WHERE id = ${id} LIMIT 1`;
    if (meetings.length === 0) {
      return NextResponse.json({ error: "Reunión no encontrada" }, { status: 404 });
    }
    if (meetings[0].host_id !== user.sub) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    await sql`DELETE FROM meeting_participants WHERE meeting_id = ${id}`;
    await sql`DELETE FROM meetings WHERE id = ${id}`;

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg === "No autenticado" ? 401 : 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    const { id } = await params;
    const body = await req.json();

    const meetings = await sql`SELECT host_id FROM meetings WHERE id = ${id} LIMIT 1`;
    if (meetings.length === 0) {
      return NextResponse.json({ error: "Reunión no encontrada" }, { status: 404 });
    }
    if (meetings[0].host_id !== user.sub) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    if (body.status === "active") {
      await sql`UPDATE meetings SET status = 'active' WHERE id = ${id}`;
    } else if (body.status === "ended") {
      await sql`UPDATE meetings SET status = 'ended', ended_at = NOW() WHERE id = ${id}`;
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg === "No autenticado" ? 401 : 500 });
  }
}
