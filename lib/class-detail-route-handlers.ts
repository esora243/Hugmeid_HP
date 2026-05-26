import type { AuthSessionPayload } from "./auth/types";
import { type ApiJsonResult, invalidRequestResult, notFoundResult, unauthorizedResult } from "./api-results";
import type { ClassMemoDto, ClassResourceDto, ClassResourceType, ClassTagDto, ClassTaskDto, ClassTaskStatus } from "./class-detail-dto";

const MAX_RESOURCE_TITLE_LENGTH = 120;
const MAX_RESOURCE_URL_LENGTH = 2048;
const MAX_TASK_TITLE_LENGTH = 120;
const MAX_TASK_DESCRIPTION_LENGTH = 2000;
const MAX_MEMO_BODY_LENGTH = 5000;
const MAX_TAG_COUNT = 20;
const MAX_TAG_LABEL_LENGTH = 32;

type ClassDetailRouteDeps = {
  listResources: (session: AuthSessionPayload, classId: string) => Promise<ClassResourceDto[] | null>;
  addResource: (session: AuthSessionPayload, classId: string, input: AddResourceInput) => Promise<"created" | "unauthorized" | "not_found">;
  listTasks: (session: AuthSessionPayload, classId: string) => Promise<ClassTaskDto[] | null>;
  addTask: (session: AuthSessionPayload, classId: string, input: AddTaskInput) => Promise<"created" | "unauthorized" | "not_found">;
  getMemo: (session: AuthSessionPayload, classId: string) => Promise<ClassMemoDto | null>;
  putMemo: (session: AuthSessionPayload, classId: string, body: string) => Promise<ClassMemoDto | null>;
  listTags: (session: AuthSessionPayload, classId: string) => Promise<ClassTagDto[] | null>;
  upsertTags: (session: AuthSessionPayload, classId: string, tags: TagInput[]) => Promise<ClassTagDto[] | null>;
  putTaskStatus: (session: AuthSessionPayload, taskId: string, status: ClassTaskStatus) => Promise<"updated" | "unauthorized" | "not_found">;
};

export type AddResourceInput = {
  type: ClassResourceType;
  title: string | null;
  url: string;
};

export type AddTaskInput = {
  title: string;
  description: string | null;
  dueAt: string | null;
};

export type TagInput = {
  label: string;
  color: string | null;
};

type ParseResult<T> = { ok: true; value: T } | { ok: false; result: ApiJsonResult };

const parsed = <T>(value: T): ParseResult<T> => ({ ok: true, value });
const invalidRequest = (message: string): ParseResult<never> => ({ ok: false, result: invalidRequestResult(message) });

function notFound(): ApiJsonResult {
  return notFoundResult("Class or task is not available");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableTrimmedString(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = asTrimmedString(value);
  return text ? text : null;
}

function limitLength(value: string | null, maxLength: number) {
  if (value === null) return true;
  return value.length <= maxLength;
}

function parseHttpUrl(value: unknown) {
  const text = asTrimmedString(value);
  if (!text) return null;
  if (text.length > MAX_RESOURCE_URL_LENGTH) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function parseIsoDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function parseResourceBody(body: unknown): ParseResult<AddResourceInput> {
  if (!isRecord(body)) return invalidRequest("Invalid JSON body");
  const type = body.type;
  if (type !== "zoom_url" && type !== "material_url" && type !== "other_url") return invalidRequest("Invalid resource type");
  const url = parseHttpUrl(body.url);
  if (!url) return invalidRequest("Valid https url is required");
  const title = nullableTrimmedString(body.title);
  if (!limitLength(title, MAX_RESOURCE_TITLE_LENGTH)) return invalidRequest("title is too long");
  return parsed({ type, title, url });
}

function parseTaskBody(body: unknown): ParseResult<AddTaskInput> {
  if (!isRecord(body)) return invalidRequest("Invalid JSON body");
  const title = asTrimmedString(body.title);
  if (!title) return invalidRequest("title is required");
  if (title.length > MAX_TASK_TITLE_LENGTH) return invalidRequest("title is too long");
  const description = nullableTrimmedString(body.description);
  if (!limitLength(description, MAX_TASK_DESCRIPTION_LENGTH)) return invalidRequest("description is too long");
  const dueAt = parseIsoDate(body.dueAt);
  if (dueAt === undefined) return invalidRequest("dueAt must be an ISO timestamp");
  return parsed({ title, description, dueAt });
}

function parseMemoBody(body: unknown): ParseResult<string> {
  if (!isRecord(body)) return invalidRequest("Invalid JSON body");
  if (typeof body.body !== "string") return invalidRequest("body is required");
  if (body.body.length > MAX_MEMO_BODY_LENGTH) return invalidRequest("body is too long");
  return parsed(body.body);
}

function parseTagsBody(body: unknown): ParseResult<TagInput[]> {
  if (!isRecord(body) || !Array.isArray(body.tags)) return invalidRequest("tags is required");
  if (body.tags.length > MAX_TAG_COUNT) return invalidRequest("too many tags");
  const seen = new Set<string>();
  const tags: TagInput[] = [];
  for (const item of body.tags) {
    if (!isRecord(item)) return invalidRequest("Invalid tag");
    const label = asTrimmedString(item.label);
    if (!label || seen.has(label)) return invalidRequest("Tag labels must be non-empty and unique");
    if (label.length > MAX_TAG_LABEL_LENGTH) return invalidRequest("Tag label is too long");
    seen.add(label);
    const color = nullableTrimmedString(item.color);
    if (color !== null && !/^#[0-9a-f]{6}$/i.test(color)) return invalidRequest("Tag color must be a hex color");
    tags.push({ label, color });
  }
  return parsed(tags);
}

function parseTaskStatusBody(body: unknown): ParseResult<ClassTaskStatus> {
  if (!isRecord(body)) return invalidRequest("Invalid JSON body");
  const status = body.status;
  if (status !== "todo" && status !== "submitted" && status !== "skipped") return invalidRequest("Invalid task status");
  return parsed(status);
}

export async function listClassResourcesJson(
  deps: Pick<ClassDetailRouteDeps, "listResources">,
  session: AuthSessionPayload,
  classId: string,
): Promise<ApiJsonResult> {
  const items = await deps.listResources(session, classId);
  if (!items) return notFound();
  return { body: { ok: true, items } };
}

export async function addClassResourceJson(
  deps: Pick<ClassDetailRouteDeps, "addResource">,
  session: AuthSessionPayload,
  classId: string,
  body: unknown,
): Promise<ApiJsonResult> {
  const input = parseResourceBody(body);
  if (!input.ok) return input.result;
  const result = await deps.addResource(session, classId, input.value);
  if (result === "unauthorized") return unauthorizedResult();
  if (result === "not_found") return notFound();
  return { body: { ok: true, created: true } };
}

export async function listClassTasksJson(
  deps: Pick<ClassDetailRouteDeps, "listTasks">,
  session: AuthSessionPayload,
  classId: string,
): Promise<ApiJsonResult> {
  const items = await deps.listTasks(session, classId);
  if (!items) return notFound();
  return { body: { ok: true, items } };
}

export async function addClassTaskJson(
  deps: Pick<ClassDetailRouteDeps, "addTask">,
  session: AuthSessionPayload,
  classId: string,
  body: unknown,
): Promise<ApiJsonResult> {
  const input = parseTaskBody(body);
  if (!input.ok) return input.result;
  const result = await deps.addTask(session, classId, input.value);
  if (result === "unauthorized") return unauthorizedResult();
  if (result === "not_found") return notFound();
  return { body: { ok: true, created: true } };
}

export async function getClassMemoJson(
  deps: Pick<ClassDetailRouteDeps, "getMemo">,
  session: AuthSessionPayload,
  classId: string,
): Promise<ApiJsonResult> {
  const item = await deps.getMemo(session, classId);
  if (!item) return notFound();
  return { body: { ok: true, item } };
}

export async function putClassMemoJson(
  deps: Pick<ClassDetailRouteDeps, "putMemo">,
  session: AuthSessionPayload,
  classId: string,
  body: unknown,
): Promise<ApiJsonResult> {
  const memoBody = parseMemoBody(body);
  if (!memoBody.ok) return memoBody.result;
  const item = await deps.putMemo(session, classId, memoBody.value);
  if (!item) return notFound();
  return { body: { ok: true, item } };
}

export async function listClassTagsJson(
  deps: Pick<ClassDetailRouteDeps, "listTags">,
  session: AuthSessionPayload,
  classId: string,
): Promise<ApiJsonResult> {
  const items = await deps.listTags(session, classId);
  if (!items) return notFound();
  return { body: { ok: true, items } };
}

export async function upsertClassTagsJson(
  deps: Pick<ClassDetailRouteDeps, "upsertTags">,
  session: AuthSessionPayload,
  classId: string,
  body: unknown,
): Promise<ApiJsonResult> {
  const tags = parseTagsBody(body);
  if (!tags.ok) return tags.result;
  const items = await deps.upsertTags(session, classId, tags.value);
  if (!items) return notFound();
  return { body: { ok: true, items } };
}

export async function putClassTaskStatusJson(
  deps: Pick<ClassDetailRouteDeps, "putTaskStatus">,
  session: AuthSessionPayload,
  taskId: string,
  body: unknown,
): Promise<ApiJsonResult> {
  const status = parseTaskStatusBody(body);
  if (!status.ok) return status.result;
  const result = await deps.putTaskStatus(session, taskId, status.value);
  if (result === "unauthorized") return unauthorizedResult();
  if (result === "not_found") return notFound();
  return { body: { ok: true, status: status.value } };
}
