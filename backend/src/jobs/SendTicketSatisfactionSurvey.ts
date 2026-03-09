import Ticket from "../models/Ticket";
import TicketSatisfactionSurvey from "../models/TicketSatisfactionSurvey";
import Queue from "../libs/Queue";
import CreateMessageSystemService from "../services/MessageServices/CreateMessageSystemService";
import { logger } from "../utils/logger";

export default {
  key: "SendTicketSatisfactionSurvey",
  options: {
    removeOnComplete: true,
    removeOnFail: false
  },
  async handle({ data }: any) {
    const survey = await TicketSatisfactionSurvey.findByPk(data.surveyId, {
      include: [
        {
          model: Ticket,
          include: ["contact"]
        }
      ]
    });

    if (!survey || !survey.ticket) {
      return;
    }

    if (survey.status !== "pending") {
      return;
    }

    if (survey.scheduledFor && survey.scheduledFor.getTime() > Date.now()) {
      await Queue.add("SendTicketSatisfactionSurvey", {
        surveyId: survey.id,
        options: {
          delay: survey.scheduledFor.getTime() - Date.now(),
          jobId: `SendTicketSatisfactionSurvey:${survey.id}:${survey.scheduledFor.getTime()}`,
          removeOnComplete: true,
          removeOnFail: false
        }
      });
      return;
    }

    if (survey.ticket.status !== "closed") {
      await survey.update({ status: "cancelled" });
      return;
    }

    try {
      await CreateMessageSystemService({
        msg: { body: survey.surveyMessage, fromMe: true, read: true },
        tenantId: survey.tenantId,
        ticket: survey.ticket,
        userId: survey.userId || undefined,
        sendType: "bot",
        status: "pending",
        isTransfer: false,
        note: false
      } as any);

      await survey.update({
        sentAt: new Date(),
        status: "sent"
      });
    } catch (error) {
      logger.error({ message: "Error sending satisfaction survey", error });
      await survey.update({ status: "failed" });
      throw error;
    }
  }
};
