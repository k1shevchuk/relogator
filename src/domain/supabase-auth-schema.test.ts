import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "vitest"

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "202606210001_auth_profiles_user_data.sql"
)

function readMigration(): string {
  if (!existsSync(migrationPath)) {
    return ""
  }

  return readFileSync(migrationPath, "utf8").toLowerCase()
}

describe("Supabase Auth schema migration", () => {
  test("exists in the project migrations folder", () => {
    expect(existsSync(migrationPath)).toBe(true)
  })

  test("creates profiles and user-owned product tables", () => {
    const migration = readMigration()

    expect(migration).toContain("create type public.app_role")
    expect(migration).toContain("'user'")
    expect(migration).toContain("'admin'")
    expect(migration).toContain("create table public.profiles")
    expect(migration).toContain("create table public.user_questionnaires")
    expect(migration).toContain("create table public.saved_route_plans")
    expect(migration).toContain("create table public.specialist_requests")
  })

  test("enables row level security and includes owner/admin policies", () => {
    const migration = readMigration()

    for (const table of [
      "profiles",
      "user_questionnaires",
      "saved_route_plans",
      "specialist_requests",
    ]) {
      expect(migration).toContain(
        `alter table public.${table} enable row level security`
      )
    }

    expect(migration).toContain("create or replace function public.is_admin")
    expect(migration).toContain("(select auth.uid())")
    expect(migration).toContain("public.is_admin()")
    expect(
      migration.match(/create policy/g)?.length ?? 0
    ).toBeGreaterThanOrEqual(10)
  })

  test("automatically creates a user profile after auth signup", () => {
    const migration = readMigration()

    expect(migration).toContain(
      "create or replace function public.handle_new_user"
    )
    expect(migration).toContain("after insert on auth.users")
    expect(migration).toContain("execute function public.handle_new_user()")
  })

  test("does not introduce storage for forbidden sensitive documents", () => {
    const migration = readMigration()
    const forbiddenColumns = [
      "passport_number",
      "passport_scan",
      "document_scan",
      "bank_card",
      "bank_account_number",
      "address_line",
      "child_document",
      "child_documents",
      "birth_certificate_scan",
    ]

    for (const column of forbiddenColumns) {
      expect(migration).not.toContain(column)
    }
  })
})
