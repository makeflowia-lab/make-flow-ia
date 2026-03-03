import { AccessToken } from "livekit-server-sdk";

export async function generateRoomToken(
  roomName: string,
  participantIdentity: string,
  participantName: string,
  isHost: boolean
): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("LIVEKIT_API_KEY and LIVEKIT_API_SECRET are required");
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
    ttl: "8h",
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isHost,
    roomRecord: isHost,
  });

  return await at.toJwt();
}
