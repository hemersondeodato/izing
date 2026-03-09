import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("TicketSatisfactionSurveys", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
      },
      ticketId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Tickets", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      contactId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      whatsappId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Whatsapps", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      queueId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Queues", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      customerNumber: {
        type: DataTypes.STRING,
        allowNull: true
      },
      surveyMessage: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      responseBody: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      responseMessageId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      invalidAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      scheduledFor: {
        type: DataTypes.DATE,
        allowNull: true
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      respondedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      lowRatingFollowupSentAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "sent",
          "answered",
          "failed",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "pending"
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex("TicketSatisfactionSurveys", ["tenantId"]);
    await queryInterface.addIndex("TicketSatisfactionSurveys", ["status"]);
    await queryInterface.addIndex("TicketSatisfactionSurveys", ["respondedAt"]);
    await queryInterface.addIndex(
      "TicketSatisfactionSurveys",
      ["ticketId", "tenantId"],
      {
        unique: true,
        name: "ticket_satisfaction_surveys_ticket_tenant_unique"
      }
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("TicketSatisfactionSurveys");
  }
};
