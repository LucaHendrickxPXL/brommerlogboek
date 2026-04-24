import fs from "node:fs/promises";
import path from "node:path";

import { getCurrentUser } from "@/server/auth";
import { withDbClient } from "@/server/db";
import { resolveUploadAbsolutePath, getMimeTypeFromFilename } from "@/server/uploads";

export const dynamic = "force-dynamic";

async function hasUploadAccess(userId: string, scope: string, entityId: string) {
  return withDbClient(async (client) => {
    if (scope === "vehicles") {
      const result = await client.query<{ id: string }>(
        `
          select id
          from vehicles
          where id = $1
            and user_id = $2
          limit 1
        `,
        [entityId, userId],
      );

      return Boolean(result.rows[0]);
    }

    if (scope === "trips") {
      const result = await client.query<{ id: string }>(
        `
          select t.id
          from trips t
          inner join vehicles v on v.id = t.vehicle_id
          where t.id = $1
            and v.user_id = $2
          limit 1
        `,
        [entityId, userId],
      );

      return Boolean(result.rows[0]);
    }

    return false;
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ segments: string[] }> },
) {
  const { segments } = await params;

  if (!Array.isArray(segments) || segments.length < 3) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return new Response("Not found", { status: 404 });
    }

    const [scope, entityId] = segments;

    if (!(await hasUploadAccess(currentUser.id, scope, entityId))) {
      return new Response("Not found", { status: 404 });
    }

    const absolutePath = resolveUploadAbsolutePath(segments);
    const buffer = await fs.readFile(absolutePath);

    return new Response(buffer, {
      headers: {
        "content-type": getMimeTypeFromFilename(path.basename(absolutePath)),
        "cache-control": "private, no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
