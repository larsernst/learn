import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { adminSettingsSchema as schema } from "@/lib/validation";
import {
  MATURE_THRESHOLD_KEY,
  getMatureThresholdDays,
  setAppSetting,
} from "@/lib/settings";

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  return NextResponse.json({ matureThresholdDays: await getMatureThresholdDays() });
}

export async function PATCH(request: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  await setAppSetting(MATURE_THRESHOLD_KEY, String(parsed.data.matureThresholdDays));
  return NextResponse.json({ matureThresholdDays: await getMatureThresholdDays() });
}
