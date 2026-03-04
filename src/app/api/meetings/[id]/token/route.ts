import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/shared/lib/jwt";
import { sql } from "@/shared/lib/db";
import { generateRoomToken } from "@/shared/lib/livekit";

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL || "wss://video-saas-c8qg6qfp.livekit.cloud";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authToken = req.cookies.get("auth_token")?.value;
    if (!authToken) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await verifyToken(authToken);
    const { id } = await params;

    const apiKey = (process.env.LIVEKIT_API_KEY || "").trim();
    const apiSecret = (process.env.LIVEKIT_API_SECRET || "").trim();

    console.log("Token API: Generating for meeting", id);
    console.log("Token API: API Key being used:", apiKey.substring(0, 5) + "...");
    console.log("Token API: LIVEKIT_API_SECRET length:", process.env.LIVEKIT_API_SECRET?.length);
    console.log("Token API: LIVEKIT_URL:", process.env.NEXT_PUBLIC_LIVEKIT_URL);

    const meetings = await sql`
      SELECT id, title, room_name, host_id, status, max_participants FROM meetings WHERE id = ${id} LIMIT 1
    `;

    if (meetings.length === 0) {
      return NextResponse.json({ error: "Reunión no encontrada" }, { status: 404 });
    }

    const meeting = meetings[0];
    const isHost = meeting.host_id === user.sub;

    // Activate meeting if host joins
    if (isHost && meeting.status === "scheduled") {
      await sql`UPDATE meetings SET status = 'active' WHERE id = ${id}`;
    }

    // Register participant
    const existing = await sql`
      SELECT id FROM meeting_participants WHERE meeting_id = ${id} AND user_id = ${user.sub} LIMIT 1
    `;
    if (existing.length === 0) {
      await sql`
        INSERT INTO meeting_participants (meeting_id, user_id, role)
        VALUES (${id}, ${user.sub}, ${isHost ? "host" : "participant"})
      `;
    } else {
      await sql`
        UPDATE meeting_participants SET joined_at = NOW(), left_at = NULL
        WHERE meeting_id = ${id} AND user_id = ${user.sub}
      `;
    }

    // Generate LiveKit token — fallback name if missing
    const participantName = user.name?.trim() || user.email.split("@")[0];
    console.log("Token API: Identity:", user.sub, "Room:", meeting.room_name);
    console.log("Token API: Participant Name:", participantName);
    console.log("Token API: isHost:", isHost);

    const livekitToken = await generateRoomToken(
      meeting.room_name,
      user.sub,
      participantName,
      isHost,
      apiKey,
      apiSecret
    );

    console.log("Token API: Token generated successfully. Length:", livekitToken.length);
    console.log("Token API: Token starts with:", livekitToken.substring(0, 20));

    return NextResponse.json({
      data: {
        token: livekitToken,
        serverUrl: LIVEKIT_URL,
        roomName: meeting.room_name,
        isHost,
      },
    });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json({ error: "Error generando token" }, { status: 500 });
  }
}
