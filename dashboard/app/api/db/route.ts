import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(readDB(), { headers: { "Cache-Control": "no-store" } });
}
