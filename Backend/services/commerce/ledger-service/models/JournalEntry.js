const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JournalEntry = sequelize.define(
    'JournalEntry',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        index: true,
      },
      transactionRef: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'Business reference (idempotency key)',
      },
      debitAccountId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Account debited',
      },
      creditAccountId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Account credited',
      },
      amount: {
        type: DataTypes.DECIMAL(19, 4),
        allowNull: false,
        comment: 'Amount in minor units (e.g., cents)',
      },
      currency: {
        type: DataTypes.CHAR(3),
        allowNull: false,
        defaultValue: 'USD',
        comment: 'ISO 4217 currency code',
      },
      entryType: {
        type: DataTypes.ENUM(
          'PAYMENT',
          'FEE',
          'REVERSAL',
          'SETTLEMENT',
          'ESCROW',
          'REFUND',
          'ADJUSTMENT'
        ),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'POSTED', 'REVERSED'),
        defaultValue: 'PENDING',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      relatedTransactionId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Link to originating transaction',
      },
      postedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Immutable posting timestamp',
      },
      reversedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Additional context (trade ID, RFQ ID, etc.)',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'JournalEntry',
      tableName: 'journal_entries',
      schema: 'ledger',
      timestamps: true,
      indexes: [
        {
          fields: ['tenantId', 'status', 'postedAt'],
          name: 'idx_journal_entries_tenant_status_date',
        },
        {
          fields: ['transactionRef', 'tenantId'],
          unique: true,
          name: 'idx_journal_entries_unique_ref_per_tenant',
        },
        {
          fields: ['debitAccountId', 'tenantId'],
          name: 'idx_journal_entries_debit_account',
        },
        {
          fields: ['creditAccountId', 'tenantId'],
          name: 'idx_journal_entries_credit_account',
        },
      ],
    }
  );

  return JournalEntry;
};
