import { cookies } from "next/headers";

import { API_URL, SESSION_COOKIE } from "@/lib/api";

/**
 * Relays the API's Server-Sent Events to the browser.
 *
 * `EventSource` cannot send an Authorization header, and the session token is
 * httpOnly by design — so the browser connects here, and this handler connects
 * upstream with the token from the cookie. The stream is passed through
 * untouched; closing the tab aborts the upstream request.
 */
export async function GET(request: Request, { params }: RouteContext<"/api/live/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("not found", { status: 404 });

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return new Response("unauthorized", { status: 401 });

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/v1/events/${id}/live`, {
      headers: { authorization: `Bearer ${token}`, accept: "text/event-stream" },
      signal: request.signal,
      cache: "no-store",
    });
  } catch {
    return new Response("upstream unavailable", { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response(await upstream.text(), { status: upstream.status });
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // Stop nginx-style proxies from buffering the stream.
      "x-accel-buffering": "no",
    },
  });
}
