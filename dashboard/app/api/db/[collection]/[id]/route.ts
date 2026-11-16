import { NextResponse } from "next/server";
import { deleteItem, isCollection, updateItem } from "@/lib/db";

type Ctx = { params: Promise<{ collection: string; id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { collection, id } = await ctx.params;
  if (!isCollection(collection)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const item = updateItem(collection, id, await req.json().catch(() => ({})));
  return item ? NextResponse.json(item) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { collection, id } = await ctx.params;
  if (!isCollection(collection)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  return NextResponse.json({ ok: deleteItem(collection, id) });
}
