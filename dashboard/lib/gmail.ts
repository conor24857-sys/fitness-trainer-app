import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DATA_DIR } from "./db";

// Gmail access is READ-ONLY. The only scope ever requested is gmail.readonly, and this
// module only makes GET requests to the Gmail API. There is no code path that sends,
// deletes, labels or modifies mail.
export const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const TOKEN_FILE = path.join(DATA_DIR, "gmail-token.json"); // gitignored (data/ and *token*.json)
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

interface Token { access_token: string; refresh_token?: string; expires_at: number; scope: string }

export function config() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const port = process.env.PORT || "3100";
  return { clientId, clientSecret, redirectUri: `http://127.0.0.1:${port}/api/gmail/callback`, configured: !!(clientId && clientSecret) };
}

/* ---- OAuth (PKCE + state, kept in memory for 10 minutes) ---- */
const pending = new Map<string, { verifier: string; exp: number }>();
const b64url = (b: Buffer) => b.toString("base64url");

export function authUrl() {
  const { clientId, redirectUri } = config();
  const state = b64url(crypto.randomBytes(24));
  const verifier = b64url(crypto.randomBytes(48));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  for (const [k, v] of pending) if (v.exp < Date.now()) pending.delete(k);
  pending.set(state, { verifier, exp: Date.now() + 10 * 60_000 });
  const p = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

export async function exchangeCode(code: string, state: string) {
  const entry = pending.get(state);
  pending.delete(state);
  if (!entry || entry.exp < Date.now()) throw new Error("Sign-in expired or state mismatch. Try Connect again.");
  const { clientId, clientSecret, redirectUri } = config();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId!, client_secret: clientSecret!, redirect_uri: redirectUri, grant_type: "authorization_code", code_verifier: entry.verifier }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error_description || j.error || "Token exchange failed");
  assertReadOnly(j.scope);
  saveToken({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in - 60) * 1000, scope: j.scope });
}

function assertReadOnly(scope: string) {
  const scopes = (scope || "").split(" ").filter(Boolean);
  if (scopes.length !== 1 || scopes[0] !== SCOPE) throw new Error(`Refusing token: expected only ${SCOPE}, got "${scope}"`);
}

function saveToken(t: Token) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(t, null, 2), { mode: 0o600 });
}
function loadToken(): Token | null {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
  } catch {
    return null;
  }
}

export class NotConnected extends Error {}

async function accessToken(): Promise<string> {
  const t = loadToken();
  if (!t) throw new NotConnected("Not connected");
  if (t.expires_at > Date.now()) return t.access_token;
  if (!t.refresh_token) throw new NotConnected("Session expired. Reconnect Gmail.");
  const { clientId, clientSecret } = config();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId!, client_secret: clientSecret!, refresh_token: t.refresh_token, grant_type: "refresh_token" }),
  });
  const j = await res.json();
  if (!res.ok) {
    if (j.error === "invalid_grant") {
      fs.rmSync(TOKEN_FILE, { force: true });
      throw new NotConnected("Google ended the session (apps in Testing mode expire after 7 days). Reconnect Gmail.");
    }
    throw new Error(j.error_description || j.error || "Refresh failed");
  }
  assertReadOnly(j.scope || t.scope);
  saveToken({ ...t, access_token: j.access_token, expires_at: Date.now() + (j.expires_in - 60) * 1000 });
  return j.access_token;
}

async function gmailGet(pathAndQuery: string) {
  const res = await fetch(`${API}${pathAndQuery}`, { method: "GET", headers: { Authorization: `Bearer ${await accessToken()}` }, cache: "no-store" });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error?.message || `Gmail API error ${res.status}`);
  return j;
}

type Header = { name: string; value: string };
const header = (hs: Header[] | undefined, name: string) => hs?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

export async function inbox() {
  const [label, list] = await Promise.all([gmailGet("/labels/INBOX"), gmailGet("/messages?labelIds=INBOX&maxResults=10")]);
  const ids: string[] = (list.messages || []).map((m: { id: string }) => m.id);
  const msgs = await Promise.all(
    ids.map((id) => gmailGet(`/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`)),
  );
  return {
    unread: label.messagesUnread as number,
    messages: msgs.map((m) => ({
      id: m.id as string,
      subject: header(m.payload?.headers, "Subject") || "(no subject)",
      from: header(m.payload?.headers, "From"),
      date: Number(m.internalDate),
      unread: (m.labelIds || []).includes("UNREAD"),
    })),
  };
}

interface Part { mimeType?: string; body?: { data?: string }; parts?: Part[] }
function findPart(p: Part, type: string): string | null {
  if (p.mimeType === type && p.body?.data) return Buffer.from(p.body.data, "base64url").toString("utf8");
  for (const c of p.parts || []) {
    const r = findPart(c, type);
    if (r) return r;
  }
  return null;
}
function htmlToText(html: string) {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n");
}

/** Plain-text version of one message, for pasting into Claude to draft a reply. */
export async function messageText(id: string) {
  if (!/^[A-Za-z0-9]+$/.test(id)) throw new Error("Bad message id");
  const m = await gmailGet(`/messages/${id}?format=full`);
  const hs = m.payload?.headers;
  let body = findPart(m.payload, "text/plain") ?? (findPart(m.payload, "text/html") ? htmlToText(findPart(m.payload, "text/html")!) : m.snippet || "");
  body = body.replace(/\r\n/g, "\n").trim();
  if (body.length > 12000) body = body.slice(0, 12000) + "\n[…truncated]";
  return [
    `From: ${header(hs, "From")}`,
    `To: ${header(hs, "To")}`,
    `Date: ${header(hs, "Date")}`,
    `Subject: ${header(hs, "Subject")}`,
    "",
    body,
  ].join("\n");
}

export async function disconnect() {
  const t = loadToken();
  fs.rmSync(TOKEN_FILE, { force: true });
  const token = t?.refresh_token || t?.access_token;
  if (token) {
    await fetch("https://oauth2.googleapis.com/revoke", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token }) }).catch(() => {});
  }
}
