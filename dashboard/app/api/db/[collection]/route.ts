import { NextResponse } from "next/server";
import { createItem, isCollection } from "@/lib/db";

export async function POST(req: Request, ctx: { params: Promise<{ collection: string }> }) {
  const { collection } = await ctx.params;
  if (!isCollection(collection)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  return NextResponse.json(createItem(collection, body));
}
