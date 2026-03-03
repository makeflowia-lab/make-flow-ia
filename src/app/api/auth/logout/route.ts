import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ data: { ok: true } });
  response.cookies.delete("auth_token");
  return response;
}
