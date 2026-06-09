import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export type AccessEvent = {
  id: string;
  visitorId: string;
  path: string;
  referrer: string;
  userAgent: string;
  createdAt: string;
  day: string;
};

export type AnalyticsData = {
  accesses: AccessEvent[];
};

export type AnalyticsSummary = {
  totalAccesses: number;
  uniqueVisitors: number;
  todayAccesses: number;
  last7Days: Array<{
    day: string;
    label: string;
    accesses: number;
  }>;
};

const analyticsPath = path.join(process.cwd(), "data", "analytics.json");
const timeZone = "America/Sao_Paulo";

function getDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

function getDayLabel(day: string) {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

function createEmptyData(): AnalyticsData {
  return { accesses: [] };
}

async function readAnalytics(): Promise<AnalyticsData> {
  try {
    return JSON.parse(await readFile(analyticsPath, "utf8")) as AnalyticsData;
  } catch {
    return createEmptyData();
  }
}

async function writeAnalytics(data: AnalyticsData) {
  await mkdir(path.dirname(analyticsPath), { recursive: true });
  await writeFile(analyticsPath, JSON.stringify(data, null, 2));
}

export async function recordAccess(input: {
  visitorId: string;
  path: string;
  referrer?: string;
  userAgent?: string;
}) {
  const data = await readAnalytics();
  const now = new Date();

  data.accesses.push({
    id: randomUUID(),
    visitorId: input.visitorId,
    path: input.path,
    referrer: input.referrer ?? "",
    userAgent: input.userAgent ?? "",
    createdAt: now.toISOString(),
    day: getDay(now),
  });

  await writeAnalytics(data);
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const data = await readAnalytics();
  const today = getDay();
  const uniqueVisitors = new Set(data.accesses.map((access) => access.visitorId)).size;
  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const day = getDay(date);

    return {
      day,
      label: getDayLabel(day),
      accesses: data.accesses.filter((access) => access.day === day).length,
    };
  });

  return {
    totalAccesses: data.accesses.length,
    uniqueVisitors,
    todayAccesses: data.accesses.filter((access) => access.day === today).length,
    last7Days,
  };
}
