
import { AccessToken } from "livekit-server-sdk";

const apiKey = "APILeaHhJue9gah";
const apiSecret = "0svWwKiVpN4EMTlkXnEWLrxleWzcki9pihpG0FvZ9GL";

const at = new AccessToken(apiKey, apiSecret, {
  identity: "test-user",
  name: "Test User",
});

at.addGrant({
  room: "test-room",
  roomJoin: true,
});

async function run() {
  const token = await at.toJwt();
  console.log("Generated Token:", token);
  
  // Try to decode manually to see the claims
  const parts = token.split('.');
  if (parts.length === 3) {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log("Payload:", JSON.stringify(payload, null, 2));
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    console.log("Header:", JSON.stringify(header, null, 2));
  }
}

run();
