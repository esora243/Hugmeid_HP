export type ApiSuccessJson = { ok: true };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function apiErrorMessage(value: unknown, fallbackMessage: string) {
  if (!isRecord(value) || value.ok === true) return fallbackMessage;
  const error = isRecord(value.error) ? value.error : null;
  return typeof error?.message === "string" && error.message ? error.message : fallbackMessage;
}

async function readJsonOrNull(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function readRequiredApiJson<TSuccess extends ApiSuccessJson>(
  response: Response,
  fallbackMessage: string,
): Promise<TSuccess> {
  const data = await readJsonOrNull(response);
  if (!response.ok || !isRecord(data) || data.ok !== true) {
    throw new Error(apiErrorMessage(data, fallbackMessage));
  }
  return data as TSuccess;
}
