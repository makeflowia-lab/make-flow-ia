import { AccessToken } from "livekit-server-sdk";

export async function generateRoomToken(
  roomName: string,
  participantIdentity: string,
  participantName: string,
  isHost: boolean,
  apiKey: string,
  apiSecret: string
): Promise<string> {
  if (!apiKey || !apiSecret) {
    console.error("LiveKit Config Missing:", { hasKey: !!apiKey, hasSecret: !!apiSecret });
    throw new Error("LIVEKIT_API_KEY and LIVEKIT_API_SECRET are required");
  }

  console.log("Generating Token with Key:", apiKey.substring(0, 5) + "...");
  console.log("Secret Length:", apiSecret.length);

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
    canUpdateOwnMetadata: true,
    roomAdmin: isHost,
    roomRecord: isHost,
  });

  return await at.toJwt();
}
