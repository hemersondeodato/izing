import Queue from "../../libs/Queue";
import Ticket from "../../models/Ticket";
import TicketSatisfactionSurvey from "../../models/TicketSatisfactionSurvey";
import SatisfactionSurveyConfigService from "./SatisfactionSurveyConfigService";

interface Request {
  ticket: Ticket;
}

const ScheduleTicketSatisfactionSurveyService = async ({
  ticket
}: Request): Promise<void> => {
  const config = await SatisfactionSurveyConfigService(ticket.tenantId);

  if (!config.enabled || ticket.status !== "closed") {
    return;
  }

  if (
    config.sendScope === "selected" &&
    (!ticket.queueId || !config.queueIds.includes(ticket.queueId))
  ) {
    return;
  }

  const existingSurvey = await TicketSatisfactionSurvey.findOne({
    where: {
      ticketId: ticket.id,
      tenantId: ticket.tenantId
    }
  });

  if (existingSurvey?.status === "answered" || existingSurvey?.sentAt) {
    return;
  }

  const scheduledFor = new Date(
    Date.now() + config.delayMinutes * 60 * 1000
  );

  const payload = {
    tenantId: ticket.tenantId,
    ticketId: ticket.id,
    contactId: ticket.contactId,
    whatsappId: ticket.whatsappId,
    userId: ticket.userId || null,
    queueId: ticket.queueId || null,
    customerNumber: ticket.contact?.number || null,
    surveyMessage: config.message,
    scheduledFor,
    status: "pending" as const,
    invalidAttempts: 0,
    sentAt: null,
    respondedAt: null,
    rating: null,
    responseBody: null,
    responseMessageId: null,
    lowRatingFollowupSentAt: null
  };

  const survey = existingSurvey
    ? await existingSurvey.update(payload)
    : await TicketSatisfactionSurvey.create(payload);

  await Queue.add("SendTicketSatisfactionSurvey", {
    surveyId: survey.id,
    options: {
      delay: config.delayMinutes * 60 * 1000,
      jobId: `SendTicketSatisfactionSurvey:${survey.id}:${scheduledFor.getTime()}`,
      removeOnComplete: true,
      removeOnFail: false
    }
  });
};

export default ScheduleTicketSatisfactionSurveyService;
