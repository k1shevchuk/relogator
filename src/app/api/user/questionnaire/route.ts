import { NextResponse, type NextRequest } from "next/server"

import { questionnaireSubmissionSchema } from "@/features/user-data/server-schemas"
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
  const parsed = questionnaireSubmissionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { saved: false, reason: "invalid_payload" },
      { status: 400 }
    )
  }

  const { error } = await supabase.from("user_questionnaires").insert({
    user_id: user.id,
    profile: parsed.data.profile as Json,
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
