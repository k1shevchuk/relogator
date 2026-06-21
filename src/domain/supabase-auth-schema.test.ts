import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "vitest"

const migrationsDir = join(process.cwd(), "supabase", "migrations")
const migrationFiles = readdirSync(migrationsDir)
const authMigrationFile = migrationFiles.find((file) =>
  file.endsWith("_auth_profiles_user_data.sql")
)
const lockDownMigrationFile = migrationFiles.find((file) =>
  file.endsWith("_lock_down_auth_helpers.sql")
)
const migrationPaths = [authMigrationFile, lockDownMigrationFile]
  .filter((file): file is string => Boolean(file))
  .map((file) => join(migrationsDir, file))

function readMigrations(): string {
  return migrationPaths
    .filter((file) => existsSync(file))
    .map((file) => readFileSync(file, "utf8").toLowerCase())
    .join("\n")
}

describe("Supabase Auth schema migration", () => {
  test("exists in the project migrations folder", () => {
    expect(authMigrationFile).toBeDefined()
    expect(lockDownMigrationFile).toBeDefined()
  })

  test("creates profiles and user-owned product tables", () => {
    const migration = readMigrations()

    expect(migration).toContain("create type public.app_role")
    expect(migration).toContain("'user'")
    expect(migration).toContain("'admin'")
    expect(migration).toContain("create table public.profiles")
    expect(migration).toContain("create table public.user_questionnaires")
    expect(migration).toContain("create table public.saved_route_plans")
    expect(migration).toContain("create table public.specialist_requests")
  })

  test("enables row level security and includes owner/admin policies", () => {
    const migration = readMigrations()

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

    expect(migration).toContain("create or replace function private.is_admin")
    expect(migration).toContain("(select auth.uid())")
    expect(migration).toContain("private.is_admin()")
    expect(migration).toContain("drop function if exists public.is_admin")
    expect(
      migration.match(/create policy/g)?.length ?? 0
    ).toBeGreaterThanOrEqual(10)
  })

  test("automatically creates a user profile after auth signup", () => {
    const migration = readMigrations()

    expect(migration).toContain(
      "create or replace function public.handle_new_user"
    )
    expect(migration).toContain("after insert on auth.users")
    expect(migration).toContain("execute function public.handle_new_user()")
  })

  test("does not introduce storage for forbidden sensitive documents", () => {
    const migration = readMigrations()
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
