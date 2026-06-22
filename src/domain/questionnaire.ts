import type { QuestionnaireDraft, UserProfile } from "./types"

export const defaultQuestionnaireDraft: QuestionnaireDraft = {}

export type QuestionnaireStepValidation = {
  success: boolean
  message?: string
}

export type FinalizeProfileResult =
  | {
      success: true
      data: UserProfile
    }
  | {
      success: false
      firstInvalidStep: number
      message: string
    }

export function validateQuestionnaireStep(
  step: number,
  draft: QuestionnaireDraft
): QuestionnaireStepValidation {
  if (step === 0 && !draft.goal) {
    return { success: false, message: "Выберите задачу переезда." }
  }

  if (step === 1) {
    if (!draft.departureWindow) {
      return { success: false, message: "Выберите срок выезда." }
    }

    if (!draft.stayDuration) {
      return { success: false, message: "Выберите срок пребывания." }
    }

    if (!draft.passportStatus) {
      return { success: false, message: "Укажите статус загранпаспорта." }
    }
  }

  if (step === 2 && (!draft.companions || draft.companions.length === 0)) {
    return { success: false, message: "Укажите, кто едет вместе с вами." }
  }

  if (step === 3) {
    if (draft.hasProvableIncome === undefined) {
      return {
        success: false,
        message: "Ответьте, есть ли подтверждаемый регулярный доход.",
      }
    }

    if (!draft.monthlyIncomeLevel) {
      return {
        success: false,
        message: "Выберите уровень подтверждаемого дохода.",
      }
    }

    if (!draft.savingsLevel) {
      return { success: false, message: "Выберите уровень накоплений." }
    }
  }

  if (step === 4 && !draft.translationReadiness) {
    return {
      success: false,
      message: "Выберите вариант по переводам и заверениям документов.",
    }
  }

  return { success: true }
}

export function finalizeQuestionnaireDraft(
  draft: QuestionnaireDraft
): FinalizeProfileResult {
  for (let step = 0; step <= 4; step += 1) {
    const result = validateQuestionnaireStep(step, draft)

    if (!result.success) {
      return {
        success: false,
        firstInvalidStep: step,
        message: result.message ?? "Заполните обязательные ответы.",
      }
    }
  }

  return {
    success: true,
    data: {
      goal: draft.goal!,
      departureWindow: draft.departureWindow!,
      stayDuration: draft.stayDuration!,
      passportStatus: draft.passportStatus!,
      visaHistory: draft.visaHistory ?? "not_sure",
      schengenHistory: draft.schengenHistory ?? "not_sure",
      visaIssues: draft.visaIssues ?? [],
      preparedDocuments: draft.preparedDocuments ?? [],
      companions: draft.companions!,
      hasProvableIncome: draft.hasProvableIncome!,
      monthlyIncomeLevel: draft.monthlyIncomeLevel!,
      savingsLevel: draft.savingsLevel!,
      hasEmploymentContract: draft.hasEmploymentContract ?? false,
      hasBusiness: draft.hasBusiness ?? false,
      willingToOpenCompany: draft.willingToOpenCompany ?? false,
      translationReadiness: draft.translationReadiness!,
      hasCriminalRecordCertificate: draft.hasCriminalRecordCertificate ?? false,
      needsSchool: draft.needsSchool ?? false,
      needsBankAccount: draft.needsBankAccount ?? false,
      valuesRussianSpeaking: draft.valuesRussianSpeaking ?? false,
      valuesLowCost: draft.valuesLowCost ?? false,
      valuesWarmClimate: draft.valuesWarmClimate ?? false,
    },
  }
}
