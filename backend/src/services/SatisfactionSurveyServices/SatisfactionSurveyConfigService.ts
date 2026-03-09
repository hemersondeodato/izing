import ListSettingsService from "../SettingServices/ListSettingsService";

export const DEFAULT_SATISFACTION_SURVEY_MESSAGE = `Olá! Seu atendimento foi finalizado.

Gostaríamos de avaliar sua experiência.
Por favor, responda com uma nota de 1 a 5:

1 - Muito ruim
2 - Ruim
3 - Regular
4 - Bom
5 - Excelente

Sua opinião é muito importante para nós.`;

export const DEFAULT_LOW_RATING_FOLLOWUP_MESSAGE = `Sentimos muito pela sua experiência.
Se desejar, nos conte o que aconteceu para que possamos melhorar.`;

interface SatisfactionSurveyConfig {
  enabled: boolean;
  delayMinutes: number;
  message: string;
  sendScope: "all" | "selected";
  queueIds: number[];
  lowRatingFollowupEnabled: boolean;
  lowRatingFollowupMessage: string;
}

const parseQueueIds = (value?: string | null): number[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(item => Number(item))
      .filter(item => Number.isInteger(item) && item > 0);
  } catch (error) {
    return [];
  }
};

const parseDelayMinutes = (value?: string | null): number => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
};

const SatisfactionSurveyConfigService = async (
  tenantId: string | number
): Promise<SatisfactionSurveyConfig> => {
  const settings = await ListSettingsService(tenantId);
  const getValue = (key: string): string | null =>
    settings?.find(setting => setting.key === key)?.value || null;

  return {
    enabled: getValue("satisfactionSurveyEnabled") === "enabled",
    delayMinutes: parseDelayMinutes(
      getValue("satisfactionSurveyDelayMinutes")
    ),
    message:
      getValue("satisfactionSurveyMessage") ||
      DEFAULT_SATISFACTION_SURVEY_MESSAGE,
    sendScope:
      getValue("satisfactionSurveySendScope") === "selected"
        ? "selected"
        : "all",
    queueIds: parseQueueIds(getValue("satisfactionSurveyQueueIds")),
    lowRatingFollowupEnabled:
      getValue("satisfactionSurveyLowRatingFollowupEnabled") === "enabled",
    lowRatingFollowupMessage:
      getValue("satisfactionSurveyLowRatingFollowupMessage") ||
      DEFAULT_LOW_RATING_FOLLOWUP_MESSAGE
  };
};

export default SatisfactionSurveyConfigService;
