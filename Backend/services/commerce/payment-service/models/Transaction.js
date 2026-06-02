const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define(
    'Transaction',
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
      idempotencyKey: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'Client-provided dedup key',
      },
      sourceAccountId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Payer account',
      },
      destinationAccountId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Payee account',
      },
      amount: {
        type: DataTypes.DECIMAL(19, 4),
        allowNull: false,
        comment: 'Amount in minor units',
      },
      fee: {
        type: DataTypes.DECIMAL(19, 4),
        defaultValue: 0,
        comment: 'Computed fee',
      },
      vat: {
        type: DataTypes.DECIMAL(19, 4),
        defaultValue: 0,
        comment: 'VAT on fee',
      },
      currency: {
        type: DataTypes.CHAR(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      paymentScheme: {
        type: DataTypes.ENUM(
          'NIP',        // Nigeria Interbank Payments System
          'VISA',
          'MASTERCARD',
          'INTERSWITCH',
          'WALLET',
          'INTERNAL',   // Internal account transfer
          'ESCROW'
        ),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          'PENDING',
          'PROCESSING',
          'COMPLETED',
          'FAILED',
          'REVERSED'
        ),
        defaultValue: 'PENDING',
      },
      failureCode: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'ISO 8583 response code on failure',
      },
      failureReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      schemeRef: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: 'External scheme reference',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'RFQ ID, trade ID, etc.',
      },
      initiatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      reversedAt: {
        type: DataTypes.DATE,
        allowNull: true,
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
      modelName: 'Transaction',
      tableName: 'transactions',
      schema: 'payments',
      timestamps: true,
      indexes: [
        {
          fields: ['tenantId', 'status', 'initiatedAt'],
          name: 'idx_transactions_tenant_status_date',
        },
        {
          fields: ['idempotencyKey', 'tenantId'],
          unique: true,
          name: 'idx_transactions_unique_idempotency',
        },
        {
          fields: ['sourceAccountId', 'tenantId'],
          name: 'idx_transactions_source_account',
        },
        {
          fields: ['destinationAccountId', 'tenantId'],
          name: 'idx_transactions_dest_account',
        },
      ],
    }
  );

  return Transaction;
};
