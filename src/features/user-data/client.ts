"use client"

import type { UserProfile } from "@/domain/types"

type SaveResult = {
  saved: boolean
  reason?: string
}

export async function saveQuestionnaireToServer(
  profile: UserProfile
): Promise<SaveResult> {
  return postUserData("/api/user/questionnaire", { profile })
}

export async function saveSpecialistRequestToServer(input: {
  routeId: string
  routeTitle: string
  countryName: string
  name: string
  contact: string
  question: string
  profile: UserProfile | null
}): Promise<SaveResult> {
  return postUserData("/api/user/specialist-requests", input)
}

async function postUserData(
  url: string,
  payload: Record<string, unknown>
): Promise<SaveResult> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await readResponseJson(response)

      return {
        saved: false,
        reason: data?.reason ?? String(response.status),
      }
    }

    return (await response.json()) as SaveResult
  } catch {
    return { saved: false, reason: "network_error" }
  }
}

async function readResponseJson(response: Response): Promise<SaveResult | null> {
  try {
    return (await response.json()) as SaveResult
  } catch {
    return null
  }
}
