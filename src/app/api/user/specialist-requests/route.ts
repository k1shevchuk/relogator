import { NextResponse, type NextRequest } from "next/server"

import { specialistRequestSubmissionSchema } from "@/features/user-data/server-schemas"
import type { Json } from "@/lib/supabase/database.types"
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { saved: false, reason: "supabase_not_configured" },
      { status: 503 }
    )
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { saved: false, reason: "not_authenticated" },
      { status: 401 }
    )
  }

  const body = await safeJson(request)
  const parsed = specialistRequestSubmissionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { saved: false, reason: "invalid_payload" },
      { status: 400 }
    )
  }

  const { error } = await supabase.from("specialist_requests").insert({
    user_id: user.id,
    route_id: parsed.data.routeId,
    route_title: parsed.data.routeTitle,
    country_name: parsed.data.countryName,
    user_name: parsed.data.name,
    contact: parsed.data.contact,
    question: parsed.data.question,
    profile: (parsed.data.profile ?? null) as Json | null,
  })

  if (error) {
    return NextResponse.json(
      { saved: false, reason: "database_error" },
      { status: 500 }
    )
  }

  return NextResponse.json({ saved: true })
}

async function safeJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
