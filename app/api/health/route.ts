import { NextResponse } from "next/server";
import { toPublicRuntimeEnvironment } from "@/lib/db/environment";
import { DatabaseConfigError, dbQuery, getDatabaseRuntimeEnvironment } from "@/lib/db/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const environment = getDatabaseRuntimeEnvironment();
    await dbQuery("select id from universities limit 1");
    return NextResponse.json({ ok: true, db: "ok", environment: toPublicRuntimeEnvironment(environment) });
  } catch (error) {
    if (error instanceof DatabaseConfigError) {
      const environment = toPublicRuntimeEnvironment(error);
      if (error.code === "database_config_missing" && error.deployEnv === "local") {
        return NextResponse.json({ ok: true, db: "not_configured", environment });
      }

      return NextResponse.json({ ok: false, db: "config_error", environment }, { status: 500 });
    }
    return NextResponse.json({ ok: false, db: "error" }, { status: 500 });
  }
}
