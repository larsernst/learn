import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  const { name, value, ...options } = getSessionCookieOptions("", 0);
  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.set(name, value, options);
  return res;
}