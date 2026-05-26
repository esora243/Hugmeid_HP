import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const schema = () =>
  readFileSync(join(process.cwd(), "cloudsql/migrations/20260524000000_initial_schema.sql"), "utf8");
const migration = (name: string) => readFileSync(join(process.cwd(), "cloudsql/migrations", name), "utf8");
const migrationNames = () => readdirSync(join(process.cwd(), "cloudsql/migrations")).filter((name) => name.endsWith(".sql"));
const seed = () =>
  readFileSync(join(process.cwd(), "cloudsql/seeds/20260524000000_minimal_lookup_seed.sql"), "utf8");

test("Cloud SQL schema covers app-owned runtime tables without external policy dependencies", () => {
  const sql = schema();

  for (const table of [
    "users",
    "app_environment",
    "rate_limit_buckets",
    "user_club_memberships",
    "user_desired_specialties",
    "bookmarks",
    "jobs",
    "syllabus_pages",
    "syllabus_class_entries",
    "user_timetable_entries",
    "syllabus_class_resources",
    "syllabus_class_tasks",
    "user_class_task_statuses",
    "user_class_memos",
    "user_class_tags",
    "user_notification_settings",
  ]) {
    assert.match(sql, new RegExp(`create table if not exists ${table}`));
  }

  assert.match(sql, /create extension if not exists pgcrypto/);
  assert.match(sql, /from pg_roles where rolname = 'hugmeid_app'/);
  assert.match(sql, /create role hugmeid_app login/);
  assert.match(sql, /create type line_friend_status/);
  assert.match(sql, /create type syllabus_source_type/);
  assert.match(sql, /external_auth_uid uuid unique/);
  assert.match(sql, /create table if not exists app_environment/);
  assert.match(sql, /database_environment/);
  assert.match(sql, /create table if not exists rate_limit_buckets/);
  assert.match(sql, /rate_limit_buckets_reset_idx/);
  assert.match(sql, /jobs_apply_url_https_check/);
  assert.match(sql, /syllabus_class_resources_url_https_check/);
  assert.match(sql, /create_trigger_if_missing/);
  assert.match(sql, /users_updated_at/);
  assert.match(sql, /unique \(user_id, content_type, job_id\)/);
  assert.match(sql, /unique \(user_id, syllabus_class_entry_id\)/);
  assert.ok(
    sql.indexOf("create role hugmeid_app login") < sql.indexOf("grant usage on schema public to hugmeid_app"),
    "runtime role must exist before grants are applied",
  );
  assert.doesNotMatch(sql, /auth\.uid\(\)/);
  assert.doesNotMatch(sql, /enable row level security/i);
  assert.doesNotMatch(sql, /grant execute/i);
  assert.doesNotMatch(sql, /grant select, insert, update, delete on all tables/i);
  assert.doesNotMatch(sql, /alter default privileges in schema public grant select, insert, update, delete on tables/i);
  assert.match(sql, /revoke all privileges on all tables in schema public from hugmeid_app/);
  assert.match(sql, /revoke all privileges on all sequences in schema public from hugmeid_app/);
  assert.match(sql, /alter default privileges in schema public revoke all privileges on tables from hugmeid_app/);
  assert.match(sql, /grant select, insert, update, delete on rate_limit_buckets to hugmeid_app/);
  assert.match(sql, /grant select, insert, update on users to hugmeid_app/);
  assert.match(sql, /grant select, insert, delete on user_club_memberships, user_desired_specialties, bookmarks to hugmeid_app/);
});

test("Cloud SQL security hardening has an idempotent forward migration for existing databases", () => {
  const names = migrationNames();
  assert.ok(names.includes("20260525000000_security_hardening.sql"));
  assert.deepEqual(names, [...names].sort(), "migrations must run in filename order");

  const sql = migration("20260525000000_security_hardening.sql");

  assert.match(sql, /create table if not exists app_environment/);
  assert.match(sql, /insert into app_environment/);
  assert.match(sql, /create table if not exists rate_limit_buckets/);
  assert.match(sql, /rate_limit_buckets_reset_idx/);
  assert.match(sql, /from pg_trigger/);
  assert.match(sql, /tgname = 'app_environment_updated_at'/);
  assert.match(sql, /jobs_apply_url_https_check/);
  assert.match(sql, /syllabus_class_resources_url_https_check/);
  assert.match(sql, /revoke all privileges on all tables in schema public from hugmeid_app/);
  assert.match(sql, /alter default privileges in schema public revoke all privileges on tables from hugmeid_app/);
  assert.match(sql, /grant select, insert, update, delete on rate_limit_buckets to hugmeid_app/);
  assert.doesNotMatch(sql, /grant select, insert, update, delete on all tables/i);
  assert.doesNotMatch(sql, /alter default privileges in schema public grant select, insert, update, delete on tables/i);
  assert.match(sql, /grant select, insert, update on users to hugmeid_app/);
});

test("Cloud SQL lookup seed provides required selectable profile and job values", () => {
  const sql = seed();

  for (const value of ["浜松医科大学", "運動部", "所属していない", "内科", "未定", "other", "part_time"]) {
    assert.match(sql, new RegExp(value));
  }

  assert.match(sql, /insert into universities/);
  assert.match(sql, /insert into clubs/);
  assert.match(sql, /insert into specialties/);
  assert.match(sql, /insert into job_categories/);
  assert.match(sql, /insert into employment_types/);
});
