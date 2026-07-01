import { NextResponse, type NextRequest } from "next/server"

import { partnerLeadSubmissionSchema } from "@/features/user-data/server-schemas"
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

  const body = await safeJson(request)
  const parsed = partnerLeadSubmissionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { saved: false, reason: "invalid_payload" },
      { status: 400 }
    )
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("partner_leads").insert({
    organization_name: parsed.data.organizationName,
    contact_name: parsed.data.contactName,
    contact: parsed.data.contact,
    website: parsed.data.website,
    countries: parsed.data.countries,
    services: parsed.data.services,
    message: parsed.data.message,
    consent: parsed.data.consent,
  })

  if (error) {
    return NextResponse.json(
      { saved: false, reason: "database_error" },
      { status: 500 }
    )
  }

  return NextResponse.json({ saved: true }, { status: 201 })
}

async function safeJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
