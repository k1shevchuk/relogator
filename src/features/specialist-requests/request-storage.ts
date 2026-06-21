"use client"

export const specialistRequestStorageKey = "relogator-specialist-requests"
const specialistRequestsChangedEvent = "relogator-specialist-requests-change"

export type StoredSpecialistRequest = {
  id: string
  createdAt: string
  name: string
  contact: string
  countryName: string
  routeId: string
  routeTitle: string
  question: string
  consent: boolean
}

export function readSpecialistRequests(): StoredSpecialistRequest[] {
  return parseSpecialistRequests(readSpecialistRequestsSnapshot())
}

export function readSpecialistRequestsSnapshot(): string {
  if (typeof window === "undefined") {
    return "[]"
  }

  return window.localStorage.getItem(specialistRequestStorageKey) ?? "[]"
}

export function parseSpecialistRequests(
  raw: string
): StoredSpecialistRequest[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function subscribeSpecialistRequests(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(specialistRequestsChangedEvent, onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(specialistRequestsChangedEvent, onStoreChange)
  }
}

export function saveSpecialistRequest(request: StoredSpecialistRequest) {
  const current = readSpecialistRequests()
  window.localStorage.setItem(
    specialistRequestStorageKey,
    JSON.stringify([request, ...current].slice(0, 50))
  )
  window.dispatchEvent(new Event(specialistRequestsChangedEvent))
}
