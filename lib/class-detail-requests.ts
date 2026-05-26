import type { ClassMemoDto, ClassResourceDto, ClassResourceType, ClassTagDto, ClassTaskDto, ClassTaskStatus } from "./class-detail-dto";

export type ActiveUserRow = {
  id: string;
  university_id: string | null;
  deactivated_at: string | null;
};

export type ActiveClassAccessRow = {
  id: string;
  syllabus_pages: { university_id: string | null; is_active: boolean } | { university_id: string | null; is_active: boolean }[] | null;
};

export type ClassResourceRow = {
  id: string;
  resource_type: ClassResourceType;
  title: string | null;
  url: string;
  created_at: string;
  updated_at: string;
};

export type ClassTaskRow = {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  created_at: string;
  updated_at: string;
  user_class_task_statuses?: { status: ClassTaskStatus } | { status: ClassTaskStatus }[] | null;
};

export type ClassMemoRow = {
  body: string;
  updated_at: string;
};

export type ClassTagRow = {
  id: string;
  syllabus_class_entry_id: string;
  label: string;
  color: string | null;
  created_at: string;
  updated_at: string;
};

function firstRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export function canAccessClass(user: ActiveUserRow, classRow: ActiveClassAccessRow) {
  const page = firstRelation(classRow.syllabus_pages);
  return Boolean(user.university_id && page?.university_id && user.university_id === page.university_id);
}

export function mapResourceRow(row: ClassResourceRow): ClassResourceDto {
  return {
    id: row.id,
    type: row.resource_type,
    title: row.title,
    url: row.url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTaskRow(row: ClassTaskRow): ClassTaskDto {
  const status = firstRelation(row.user_class_task_statuses)?.status ?? null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueAt: row.due_at,
    status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMemoRow(classId: string, row: ClassMemoRow | null): ClassMemoDto {
  return { classId, body: row?.body ?? "", updatedAt: row?.updated_at ?? null };
}

export function mapTagRow(row: ClassTagRow): ClassTagDto {
  return {
    id: row.id,
    classId: row.syllabus_class_entry_id,
    label: row.label,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
