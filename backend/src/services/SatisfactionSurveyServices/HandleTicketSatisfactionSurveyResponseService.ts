import { Message as WbotMessage } from "whatsapp-web.js";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import TicketSatisfactionSurvey from "../../models/TicketSatisfactionSurvey";
import CreateMessageService from "../MessageServices/CreateMessageService";
import CreateMessageSystemService from "../MessageServices/CreateMessageSystemService";
import SatisfactionSurveyConfigService from "./SatisfactionSurveyConfigService";

interface Request {
  msg: WbotMessage;
  contact: Contact;
  tenantId: string | number;
  whatsappId: number;
}

const HandleTicketSatisfactionSurveyResponseService = async ({
  msg,
  contact,
  tenantId,
  whatsappId
}: Request): Promise<boolean> => {
  if (msg.fromMe || msg.type !== "chat") {
    return false;
  }

  const survey = await TicketSatisfactionSurvey.findOne({
    where: {
      tenantId,
      contactId: contact.id,
      whatsappId,
      status: "sent",
      respondedAt: null
    },
    include: [
      {
        model: Ticket,
        include: ["contact"]
      }
    ],
    order: [["sentAt", "DESC"]]
  });

  if (!survey || !survey.ticket) {
    return false;
  }

  const body = (msg.body || "").trim();
  const isNumericAttempt = /^[0-9]+$/.test(body);
  const rating = Number(body);

  if (!isNumericAttempt) {
    return false;
  }

  await CreateMessageService({
    tenantId,
    messageData: {
      messageId: msg.id.id,
      ticketId: survey.ticketId,
      contactId: contact.id,
      body: msg.body,
      fromMe: false,
      mediaType: msg.type,
      read: false,
      timestamp: msg.timestamp,
      id: msg.id.id
    }
  });

  await survey.ticket.update({
    lastMessage: msg.body,
    lastMessageAt: new Date().getTime(),
    answered: false
  });

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    await survey.update({
      invalidAttempts: (survey.invalidAttempts || 0) + 1
    });
    return true;
  }

  await survey.update({
    rating,
    responseBody: msg.body,
    responseMessageId: msg.id.id,
    respondedAt: new Date(),
    status: "answered"
  });

  const config = await SatisfactionSurveyConfigService(tenantId);

  if (rating <= 2 && config.lowRatingFollowupEnabled) {
    await CreateMessageSystemService({
      msg: { body: config.lowRatingFollowupMessage, fromMe: true, read: true },
      tenantId,
      ticket: survey.ticket,
      userId: survey.userId || undefined,
      sendType: "bot",
      status: "pending",
      isTransfer: false,
      note: false
    } as any);

    await survey.update({
      lowRatingFollowupSentAt: new Date()
    });
  }

  return true;
};

export default HandleTicketSatisfactionSurveyResponseService;
