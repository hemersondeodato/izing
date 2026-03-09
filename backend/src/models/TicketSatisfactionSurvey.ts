import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull,
  DataType
} from "sequelize-typescript";
import Ticket from "./Ticket";
import Contact from "./Contact";
import Whatsapp from "./Whatsapp";
import User from "./User";
import Queue from "./Queue";
import Tenant from "./Tenant";

@Table
class TicketSatisfactionSurvey extends Model<TicketSatisfactionSurvey> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => Contact)
  @AllowNull
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => Whatsapp)
  @AllowNull
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;

  @ForeignKey(() => User)
  @AllowNull
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Queue)
  @AllowNull
  @Column
  queueId: number;

  @BelongsTo(() => Queue)
  queue: Queue;

  @AllowNull
  @Column
  customerNumber: string;

  @AllowNull
  @Column(DataType.TEXT)
  surveyMessage: string;

  @AllowNull
  @Column(DataType.TEXT)
  responseBody: string;

  @AllowNull
  @Column
  responseMessageId: string;

  @AllowNull
  @Column(DataType.INTEGER)
  rating: number;

  @Default(0)
  @Column(DataType.INTEGER)
  invalidAttempts: number;

  @AllowNull
  @Column(DataType.DATE)
  scheduledFor: Date;

  @AllowNull
  @Column(DataType.DATE)
  sentAt: Date;

  @AllowNull
  @Column(DataType.DATE)
  respondedAt: Date;

  @AllowNull
  @Column(DataType.DATE)
  lowRatingFollowupSentAt: Date;

  @Default("pending")
  @Column(
    DataType.ENUM("pending", "sent", "answered", "failed", "cancelled")
  )
  status: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default TicketSatisfactionSurvey;
