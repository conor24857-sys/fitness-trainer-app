import { NextResponse } from "next/server";
import { authUrl, config } from "@/lib/gmail";

export const dynamic = "force-dynamic";

export function GET() {
  if (!config().configured) return NextResponse.json({ error: "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local first" }, { status: 400 });
  return NextResponse.redirect(authUrl());
}
