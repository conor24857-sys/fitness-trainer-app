import { NextResponse } from "next/server";
import { NotConnected, config, inbox } from "@/lib/gmail";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!config().configured) return NextResponse.json({ configured: false, connected: false });
  try {
    return NextResponse.json({ configured: true, connected: true, ...(await inbox()) });
  } catch (e) {
    if (e instanceof NotConnected) return NextResponse.json({ configured: true, connected: false, message: e.message });
    return NextResponse.json({ configured: true, connected: true, error: (e as Error).message }, { status: 502 });
  }
}
