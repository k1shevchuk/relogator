import { z } from "zod"

import { userProfileSchema } from "@/features/questionnaire/profile-schema"

export const questionnaireSubmissionSchema = z.object({
  profile: userProfileSchema,
})

export const specialistRequestSubmissionSchema = z.object({
  routeId: z.string().trim().min(1).max(120),
  routeTitle: z.string().trim().min(1).max(240),
  countryName: z.string().trim().min(1).max(120),
  name: z.string().trim().min(2).max(120),
  contact: z.string().trim().min(4).max(180),
  question: z.string().trim().min(10).max(2000),
  profile: userProfileSchema.optional().nullable(),
})

export const partnerLeadSubmissionSchema = z
  .object({
    organizationName: z.string().trim().min(2).max(180),
    contactName: z.string().trim().min(2).max(120),
    contact: z.string().trim().min(4).max(180),
    website: z.string().trim().max(240).optional().default(""),
    countries: z.string().trim().min(2).max(500),
    services: z.string().trim().min(2).max(500),
    message: z.string().trim().min(10).max(2000),
    consent: z.literal(true),
    websiteUrl: z.string().trim().max(0).optional().default(""),
  })
  .transform((value) => ({
    organizationName: value.organizationName,
    contactName: value.contactName,
    contact: value.contact,
    website: value.website,
    countries: value.countries,
    services: value.services,
    message: value.message,
    consent: value.consent,
  }))
