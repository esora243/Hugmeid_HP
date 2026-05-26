import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  addClassResourceJson,
  addClassTaskJson,
  getClassMemoJson,
  listClassResourcesJson,
  putClassMemoJson,
  putClassTaskStatusJson,
  upsertClassTagsJson,
} from "../lib/class-detail-route-handlers";
import { withRequiredSession } from "../lib/api-results";
import {
  canAccessClass,
  mapMemoRow,
  mapResourceRow,
  mapTagRow,
  mapTaskRow,
} from "../lib/class-detail-requests";

test("class detail access checks require an active class page from the same university", () => {
  assert.equal(
    canAccessClass(
      { id: "user-1", university_id: "univ-1", deactivated_at: null },
      { id: "class-1", syllabus_pages: { university_id: "univ-1", is_active: true } },
    ),
    true,
  );
  assert.equal(
    canAccessClass(
      { id: "user-1", university_id: "univ-1", deactivated_at: null },
      { id: "class-1", syllabus_pages: { university_id: "univ-2", is_active: true } },
    ),
    false,
  );
});

test("class detail SQL stays active-page and own-user scoped", () => {
  const source = readFileSync(join(process.cwd(), "lib/class-detail.ts"), "utf8");

  assert.match(source, /sce\.is_active = true/);
  assert.match(source, /sp\.is_active = true/);
  assert.match(source, /where user_id = \$1\s+and syllabus_class_entry_id = \$2/);
  assert.match(source, /created_by_user_id,\s+updated_by_user_id/);
  assert.match(source, /values \(\$1, \$2, \$3\)/);
  assert.match(source, /insert into user_class_task_statuses \(user_id, syllabus_class_task_id, status, completed_at\)/);
});

test("class detail rows map to DTOs without raw ownership fields", () => {
  assert.deepEqual(
    mapResourceRow({
      id: "resource-1",
      resource_type: "material_url",
      title: null,
      url: "https://example.com/material",
      created_at: "2026-05-10T00:00:00.000Z",
      updated_at: "2026-05-10T00:00:00.000Z",
    }),
    {
      id: "resource-1",
      type: "material_url",
      title: null,
      url: "https://example.com/material",
      createdAt: "2026-05-10T00:00:00.000Z",
      updatedAt: "2026-05-10T00:00:00.000Z",
    },
  );
  assert.equal(mapTaskRow({ id: "task-1", title: "課題", description: null, due_at: null, created_at: "c", updated_at: "u", user_class_task_statuses: { status: "todo" } }).status, "todo");
  assert.deepEqual(mapMemoRow("class-1", null), { classId: "class-1", body: "", updatedAt: null });
  assert.equal(mapTagRow({ id: "tag-1", syllabus_class_entry_id: "class-1", label: "重要", color: null, created_at: "c", updated_at: "u" }).classId, "class-1");
});

test("shared session boundary does not touch class-detail dependencies without a session", async () => {
  let calls = 0;

  assert.deepEqual(
    await withRequiredSession(
      async () => null,
      async () => {
        calls += 1;
        return { body: { ok: true } };
      },
    ),
    { body: { ok: false, error: { code: "unauthorized", message: "Login is required" } }, status: 401 },
  );
  assert.equal(calls, 0);
});

test("class detail JSON handlers reject invalid inputs and preserve not-found contracts", async () => {
  const session = { userId: "user-1" };

  assert.equal(
    (await addClassResourceJson({
      addResource: async () => "created",
    }, session, "class-1", { type: "zoom_url", url: "javascript:alert(1)" })).status,
    400,
  );
  assert.deepEqual(
    await upsertClassTagsJson({
      upsertTags: async () => null,
    }, session, "class-1", { tags: [{ label: "重要" }] }),
    { body: { ok: false, error: { code: "not_found", message: "Class or task is not available" } }, status: 404 },
  );
  assert.equal(
    (await putClassTaskStatusJson({
      putTaskStatus: async () => "updated",
    }, session, "task-1", { status: "done" })).status,
    400,
  );
  assert.equal(
    (await addClassTaskJson({
      addTask: async () => "created",
    }, session, "class-1", { title: "課題", dueAt: "2026-05-10T09:00" })).status,
    400,
  );
});

test("class detail JSON handlers reject unsafe or oversized user content", async () => {
  const session = { userId: "user-1" };

  assert.equal(
    (await addClassResourceJson({
      addResource: async () => "created",
    }, session, "class-1", { type: "material_url", title: "Material", url: "http://example.com/insecure" })).status,
    400,
  );
  assert.equal(
    (await addClassTaskJson({
      addTask: async () => "created",
    }, session, "class-1", { title: "x".repeat(121) })).status,
    400,
  );
  assert.equal(
    (await putClassMemoJson({
      putMemo: async () => ({ classId: "class-1", body: "", updatedAt: null }),
    }, session, "class-1", { body: "x".repeat(5001) })).status,
    400,
  );
  assert.equal(
    (await upsertClassTagsJson({
      upsertTags: async () => [],
    }, session, "class-1", { tags: [{ label: "valid", color: "red" }] })).status,
    400,
  );
});

test("class task dueAt requires an explicit timezone before normalization", async () => {
  const session = { userId: "user-1" };
  let capturedDueAt: string | null = null;

  const result = await addClassTaskJson({
    addTask: async (_session, _classId, input) => {
      capturedDueAt = input.dueAt;
      return "created";
    },
  }, session, "class-1", { title: "課題", dueAt: "2026-05-10T09:00:00+09:00" });

  assert.deepEqual(result, { body: { ok: true, created: true } });
  assert.equal(capturedDueAt, "2026-05-10T00:00:00.000Z");
});

test("class detail routes require a session before class data access", () => {
  const routes = [
    "app/api/syllabus/classes/[classId]/resources/route.ts",
    "app/api/syllabus/classes/[classId]/tasks/route.ts",
    "app/api/me/class-memos/[classId]/route.ts",
    "app/api/me/class-tags/[classId]/route.ts",
    "app/api/me/class-task-statuses/[taskId]/route.ts",
  ];
  const routeHelper = readFileSync(join(process.cwd(), "lib/next-json-route.ts"), "utf8");
  const resultHelper = readFileSync(join(process.cwd(), "lib/api-results.ts"), "utf8");

  for (const route of routes) {
    const source = readFileSync(join(process.cwd(), route), "utf8");
    assert.match(source, /sessionJsonRoute|guardedSessionJsonBodyRoute/);
  }
  assert.match(routeHelper, /readSessionFromCookies/);
  assert.match(routeHelper, /withRequiredSession/);
  assert.match(resultHelper, /apiErrorResult\("unauthorized", "Login is required", 401\)/);
});
