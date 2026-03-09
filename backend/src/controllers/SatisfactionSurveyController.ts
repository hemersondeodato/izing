import { Request, Response } from "express";
import AppError from "../errors/AppError";
import GetSatisfactionSurveyReportService from "../services/SatisfactionSurveyServices/GetSatisfactionSurveyReportService";

type ReportQuery = {
  startDate?: string;
  endDate?: string;
  userId?: string;
  queueId?: string;
};

export const report = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { tenantId } = req.user;
  const { startDate, endDate, userId, queueId } = req.query as ReportQuery;

  const data = await GetSatisfactionSurveyReportService({
    tenantId,
    startDate,
    endDate,
    userId,
    queueId
  });

  return res.status(200).json(data);
};
