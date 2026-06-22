import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "vitest"

const migrationsDir = join(process.cwd(), "supabase", "migrations")
const migrationFiles = readdirSync(migrationsDir)
const contentGraphMigrationFile = migrationFiles.find((file) =>
  file.endsWith("_content_graph.sql")
)
const migrationPath = contentGraphMigrationFile
  ? join(migrationsDir, contentGraphMigrationFile)
  : ""

function readMigration(): string {
  if (!migrationPath || !existsSync(migrationPath)) {
    return ""
  }

  return readFileSync(migrationPath, "utf8").toLowerCase()
}

describe("Supabase content graph schema migration", () => {
  test("exists in the project migrations folder", () => {
    expect(contentGraphMigrationFile).toBeDefined()
  })

  test("creates tables for countries, sources and route graph data", () => {
    const migration = readMigration()

    expect(migration).toContain("create table public.content_countries")
    expect(migration).toContain("create table public.content_sources")
    expect(migration).toContain("create table public.content_routes")
    expect(migration).toContain("requirements jsonb")
    expect(migration).toContain("steps jsonb")
    expect(migration).toContain("decision_graph jsonb")
  })

  test("enables public read access through RLS and keeps writes admin-only", () => {
    const migration = readMigration()

    for (const table of [
      "content_countries",
      "content_sources",
      "content_routes",
    ]) {
      expect(migration).toContain(
        `alter table public.${table} enable row level security`
      )
      expect(migration).toContain(`grant select on table public.${table}`)
      expect(migration).toContain(`admin_manage_${table}`)
    }

    expect(migration).toContain("private.is_admin()")
    expect(migration).toContain("to anon, authenticated")
  })

  test("adds indexes for route filtering and JSON rule lookup", () => {
    const migration = readMigration()

    expect(migration).toContain("content_routes_country_code_idx")
    expect(migration).toContain("content_routes_goals_gin_idx")
    expect(migration).toContain("content_routes_stay_durations_gin_idx")
    expect(migration).toContain("content_routes_requirements_gin_idx")
    expect(migration).toContain("using gin")
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
