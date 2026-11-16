import { NextResponse } from "next/server";
import { config, exchangeCode } from "@/lib/gmail";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const home = config().redirectUri.replace("/api/gmail/callback", "/");
  const err = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  if (err || !code) return NextResponse.redirect(`${home}?gmail_error=${encodeURIComponent(err || "No code returned")}`);
  try {
    await exchangeCode(code, state);
    return NextResponse.redirect(home);
  } catch (e) {
    return NextResponse.redirect(`${home}?gmail_error=${encodeURIComponent((e as Error).message)}`);
  }
}
