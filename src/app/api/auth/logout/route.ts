import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookieOptions } from "@/lib/session";
import { requireSameOrigin } from "@/lib/origin";

export async function POST(request: NextRequest) {
  const originCheck = requireSameOrigin(request);
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: "Verboten: " + (originCheck.reason ?? "Ursprung nicht erlaubt") },
      { status: 403 }
    );
  }
  const { name, value, ...options } = getSessionCookieOptions("", 0);
  const res = NextResponse.redirect(new URL("/", request.nextUrl));
  res.cookies.set(name, value, options);
  return res;
}