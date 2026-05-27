const HugNavi_RUNTIME_ENVIRONMENTS = ["local", "staging", "production"] as const;

type HugNaviRuntimeEnvironment = (typeof HugNavi_RUNTIME_ENVIRONMENTS)[number];

export type DatabaseConfigErrorCode =
  | "deploy_env_required"
  | "deploy_env_invalid"
  | "database_env_required"
  | "database_env_invalid"
  | "database_env_mismatch"
  | "database_config_missing";

export type SanitizedRuntimeEnvironment = HugNaviRuntimeEnvironment | "missing" | "invalid";

const VALID_RUNTIME_ENVIRONMENTS = new Set<string>(HugNavi_RUNTIME_ENVIRONMENTS);

export class DatabaseConfigError extends Error {
  readonly code: DatabaseConfigErrorCode;
  readonly deployEnv: SanitizedRuntimeEnvironment;
  readonly databaseEnv: SanitizedRuntimeEnvironment;

  constructor(
    message: string,
    {
      code,
      deployEnv = "missing",
      databaseEnv = "missing",
    }: {
      code: DatabaseConfigErrorCode;
      deployEnv?: SanitizedRuntimeEnvironment;
      databaseEnv?: SanitizedRuntimeEnvironment;
    },
  ) {
    super(message);
    this.name = "DatabaseConfigError";
    this.code = code;
    this.deployEnv = deployEnv;
    this.databaseEnv = databaseEnv;
  }
}

export type DatabaseRuntimeEnvironment = {
  deployEnv: HugNaviRuntimeEnvironment;
  databaseEnv: HugNaviRuntimeEnvironment;
};

type RuntimeEnvironmentRead =
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "valid"; value: HugNaviRuntimeEnvironment };

function cleanEnvValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isHugNaviRuntimeEnvironment(value: string): value is HugNaviRuntimeEnvironment {
  return VALID_RUNTIME_ENVIRONMENTS.has(value);
}

function readRuntimeEnvironment(value: string | undefined): RuntimeEnvironmentRead {
  const cleaned = cleanEnvValue(value);
  if (!cleaned) return { status: "missing" };
  return isHugNaviRuntimeEnvironment(cleaned) ? { status: "valid", value: cleaned } : { status: "invalid" };
}

function sanitizeRuntimeEnvironment(read: RuntimeEnvironmentRead): SanitizedRuntimeEnvironment {
  return read.status === "valid" ? read.value : read.status;
}

export function resolveDatabaseRuntimeEnvironment(env: NodeJS.ProcessEnv = process.env): DatabaseRuntimeEnvironment {
  const deployRead = readRuntimeEnvironment(env.HugNavi_DEPLOY_ENV);
  const databaseRead = readRuntimeEnvironment(env.HugNavi_DATABASE_ENV);
  const databaseEnv = databaseRead.status === "valid" ? databaseRead.value : undefined;

  if (deployRead.status === "missing" && env.NODE_ENV === "production") {
    throw new DatabaseConfigError("HugNavi_DEPLOY_ENV is required when NODE_ENV is production", {
      code: "deploy_env_required",
      deployEnv: "missing",
      databaseEnv: sanitizeRuntimeEnvironment(databaseRead),
    });
  }

  if (deployRead.status === "invalid") {
    throw new DatabaseConfigError("HugNavi_DEPLOY_ENV must be local, staging, or production", {
      code: "deploy_env_invalid",
      deployEnv: "invalid",
      databaseEnv: sanitizeRuntimeEnvironment(databaseRead),
    });
  }

  const deployEnv = deployRead.status === "valid" ? deployRead.value : "local";

  if (databaseRead.status === "invalid") {
    throw new DatabaseConfigError("HugNavi_DATABASE_ENV must be local, staging, or production", {
      code: "database_env_invalid",
      deployEnv,
      databaseEnv: "invalid",
    });
  }

  if (!databaseEnv && deployEnv !== "local") {
    throw new DatabaseConfigError("HugNavi_DATABASE_ENV is required for staging and production deployments", {
      code: "database_env_required",
      deployEnv,
      databaseEnv: "missing",
    });
  }

  const resolvedDatabaseEnv = databaseEnv ?? "local";

  if (env.NODE_ENV === "production" && deployEnv === "local") {
    throw new DatabaseConfigError("HugNavi_DEPLOY_ENV cannot be local when NODE_ENV is production", {
      code: "deploy_env_invalid",
      deployEnv,
      databaseEnv: resolvedDatabaseEnv,
    });
  }

  if (deployEnv !== "local" && resolvedDatabaseEnv !== deployEnv) {
    throw new DatabaseConfigError("HugNavi_DATABASE_ENV must match HugNavi_DEPLOY_ENV outside local development", {
      code: "database_env_mismatch",
      deployEnv,
      databaseEnv: resolvedDatabaseEnv,
    });
  }

  return { deployEnv, databaseEnv: resolvedDatabaseEnv };
}

export function toPublicRuntimeEnvironment(error: DatabaseConfigError | DatabaseRuntimeEnvironment) {
  return { deploy: error.deployEnv, database: error.databaseEnv };
}
