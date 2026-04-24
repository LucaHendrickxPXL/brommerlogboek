import { NextResponse } from "next/server";

import { getDatabaseHealth } from "@/server/db";

export async function GET() {
  const database = await getDatabaseHealth();
  const ok = database.status !== "down";

  return NextResponse.json(
    {
      ok,
      timestamp: new Date().toISOString(),
      database,
    },
    {
      status: ok ? 200 : 503,
    },
  );
}
