"use client"

import {
  profileStorageKey,
  userProfileSchema,
} from "@/features/questionnaire/profile-schema"
import type { UserProfile } from "@/domain/types"

export function readStoredProfile(): UserProfile | null {
  const raw = window.localStorage.getItem(profileStorageKey)

  return parseStoredProfile(raw)
}

export function parseStoredProfile(raw: string | null): UserProfile | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = userProfileSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function subscribeStoredProfile(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)

  return () => window.removeEventListener("storage", onStoreChange)
}

export function readStoredProfileSnapshot() {
  return window.localStorage.getItem(profileStorageKey) ?? ""
}
