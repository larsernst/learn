import { prisma } from "@/lib/prisma";
import { MAX_INTERVAL_DAYS } from "@/lib/sm2";

export const MATURE_THRESHOLD_KEY = "matureThresholdDays";
export const MATURE_THRESHOLD_DEFAULT = MAX_INTERVAL_DAYS;

export async function getAppSetting(key: string): Promise<string | null> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getMatureThresholdDays(): Promise<number> {
  const raw = await getAppSetting(MATURE_THRESHOLD_KEY);
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 1 ? n : MATURE_THRESHOLD_DEFAULT;
}
