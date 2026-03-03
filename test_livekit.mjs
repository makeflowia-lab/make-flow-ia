
import { RoomServiceClient } from "livekit-server-sdk";

const apiKey = "APILeaHhJue9gah";
const apiSecret = "0svWwKiVpN4EMTlkXnEWLrxleWzcki9pihpG0FvZ9GL";
const url = "https://video-saas-c8qg6qfp.livekit.cloud";

const roomService = new RoomServiceClient(url, apiKey, apiSecret);

async function test() {
  try {
    console.log("Testing credentials...");
    const rooms = await roomService.listRooms();
    console.log("Success! Rooms count:", rooms.length);
  } catch (error) {
    console.error("Failed to authenticate with LiveKit:", error.message);
  }
}

test();
