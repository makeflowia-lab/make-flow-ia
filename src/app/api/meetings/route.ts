import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/shared/lib/jwt";
import { sql } from "@/shared/lib/db";
import { createMeetingSchema } from "@/shared/lib/validations";
import { randomUUID } from "crypto";

async function getUser(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) throw new Error("No autenticado");
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);

    const meetings = await sql`
      SELECT
        m.*,
        u.name AS host_name,
        COUNT(mp.id) FILTER (WHERE mp.left_at IS NULL) AS participant_count
      FROM meetings m
      LEFT JOIN users u ON u.id = m.host_id
      LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id
      WHERE m.host_id = ${user.sub}
         OR m.id IN (SELECT meeting_id FROM meeting_participants WHERE user_id = ${user.sub})
      GROUP BY m.id, u.name
      ORDER BY m.created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({ data: meetings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg === "No autenticado" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    const body = await req.json();
    const parsed = createMeetingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { title, description, starts_at, max_participants } = parsed.data;
    const roomName = `room_${randomUUID().replace(/-/g, "")}`;

    const [meeting] = await sql`
      INSERT INTO meetings (title, description, host_id, room_name, status, starts_at, max_participants)
      VALUES (
        ${title},
        ${description ?? null},
        ${user.sub},
        ${roomName},
        'scheduled',
        ${starts_at ?? null},
        ${max_participants}
      )
      RETURNING *
    `;

    // Add host as participant
    await sql`
      INSERT INTO meeting_participants (meeting_id, user_id, role)
      VALUES (${meeting.id}, ${user.sub}, 'host')
    `;

    return NextResponse.json({ data: { ...meeting, host_name: user.name } }, { status: 201 });
  } catch (error) {
    console.error("Create meeting error:", error);
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg === "No autenticado" ? 401 : 500 });
  }
}
