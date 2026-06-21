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
