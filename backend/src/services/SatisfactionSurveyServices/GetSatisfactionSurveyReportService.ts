import { QueryTypes } from "sequelize";
import sequelize from "../../database";

interface Request {
  tenantId: string | number;
  startDate?: string | null;
  endDate?: string | null;
  userId?: string | number | null;
  queueId?: string | number | null;
}

const baseWhere = `
  where s."tenantId" = :tenantId
    and s.status = 'answered'
    and (:startDate::date is null or date_trunc('day', s."respondedAt") >= :startDate::date)
    and (:endDate::date is null or date_trunc('day', s."respondedAt") <= :endDate::date)
    and (:userId::integer is null or s."userId" = :userId::integer)
    and (:queueId::integer is null or s."queueId" = :queueId::integer)
`;

const GetSatisfactionSurveyReportService = async ({
  tenantId,
  startDate = null,
  endDate = null,
  userId = null,
  queueId = null
}: Request): Promise<any> => {
  const replacements = {
    tenantId,
    startDate,
    endDate,
    userId: userId ? Number(userId) : null,
    queueId: queueId ? Number(queueId) : null
  };

  const [summary] = (await sequelize.query(
    `
      select
        coalesce(round(avg(s.rating)::numeric, 2), 0) as "averageRating",
        count(*)::integer as "totalResponses"
      from "TicketSatisfactionSurveys" s
      ${baseWhere}
    `,
    {
      replacements,
      type: QueryTypes.SELECT
    }
  )) as any[];

  const distribution = await sequelize.query(
    `
      select
        s.rating,
        count(*)::integer as total
      from "TicketSatisfactionSurveys" s
      ${baseWhere}
      group by s.rating
      order by s.rating asc
    `,
    {
      replacements,
      type: QueryTypes.SELECT
    }
  );

  const averagesByUser = await sequelize.query(
    `
      select
        s."userId",
        coalesce(u.name, 'Sem atendente') as name,
        round(avg(s.rating)::numeric, 2) as "averageRating",
        count(*)::integer as "totalResponses"
      from "TicketSatisfactionSurveys" s
      left join "Users" u on u.id = s."userId"
      ${baseWhere}
      group by s."userId", u.name
      order by "averageRating" desc, name asc
    `,
    {
      replacements,
      type: QueryTypes.SELECT
    }
  );

  const responses = await sequelize.query(
    `
      select
        s.id,
        s."ticketId",
        s."customerNumber",
        s.rating,
        s."sentAt",
        s."respondedAt",
        s.status,
        c.name as "contactName",
        coalesce(u.name, 'Sem atendente') as "userName",
        coalesce(q.queue, 'Sem fila') as "queueName"
      from "TicketSatisfactionSurveys" s
      left join "Contacts" c on c.id = s."contactId"
      left join "Users" u on u.id = s."userId"
      left join "Queues" q on q.id = s."queueId"
      ${baseWhere}
      order by s."respondedAt" desc
    `,
    {
      replacements,
      type: QueryTypes.SELECT
    }
  );

  return {
    summary,
    distribution,
    averagesByUser,
    responses
  };
};

export default GetSatisfactionSurveyReportService;
