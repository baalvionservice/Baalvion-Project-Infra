'use strict';
const { Sequelize } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: config.env === 'development' ? console.log : false,
    define: { underscored: true, timestamps: true },
});

const db = { sequelize, Sequelize };

// ── Existing models ──────────────────────────────────────────────────────────
db.Dashboard = require('./dashboards')(sequelize);
db.DataSource = require('./data_sources')(sequelize);
db.Widget = require('./widgets')(sequelize);
db.MetricSnapshot = require('./metric_snapshots')(sequelize);
db.ScheduledReport = require('./scheduled_reports')(sequelize);

// ── New models ───────────────────────────────────────────────────────────────
db.Domain = require('./domains')(sequelize);
db.FinancialEntry = require('./financial_entries')(sequelize);
db.Shareholder = require('./shareholders')(sequelize);
db.EquityHistory = require('./equity_history')(sequelize);
db.DistributionHistory = require('./distribution_history')(sequelize);
db.Employee = require('./employees')(sequelize);
db.Attendance = require('./attendance')(sequelize);
db.Task = require('./tasks')(sequelize);
db.TaskComment = require('./task_comments')(sequelize);
db.Transaction = require('./transactions')(sequelize);
db.KPI = require('./kpis')(sequelize);
db.ComplianceRecord = require('./compliance_records')(sequelize);
db.AuditLog = require('./audit_logs')(sequelize);
db.Permission = require('./permissions')(sequelize);
db.GeneratedReport = require('./generated_reports')(sequelize);
db.PortalAccess = require('./portal_access')(sequelize);
db.Notification = require('./notifications')(sequelize);
db.OperationsAlert = require('./operations_alerts')(sequelize);
db.AlertRule = require('./alert_rules')(sequelize);

// ── Existing associations ────────────────────────────────────────────────────
db.Dashboard.hasMany(db.Widget, { foreignKey: 'dashboard_id', as: 'widgets', onDelete: 'CASCADE' });
db.Widget.belongsTo(db.Dashboard, { foreignKey: 'dashboard_id', as: 'dashboard' });

db.DataSource.hasMany(db.Widget, { foreignKey: 'data_source_id', as: 'widgets' });
db.Widget.belongsTo(db.DataSource, { foreignKey: 'data_source_id', as: 'data_source' });

db.Dashboard.hasMany(db.ScheduledReport, { foreignKey: 'dashboard_id', as: 'scheduled_reports' });
db.ScheduledReport.belongsTo(db.Dashboard, { foreignKey: 'dashboard_id', as: 'dashboard' });

// ── New associations ─────────────────────────────────────────────────────────

// Domain → FinancialEntry
db.Domain.hasMany(db.FinancialEntry, { foreignKey: 'domain_id', as: 'financial_entries' });
db.FinancialEntry.belongsTo(db.Domain, { foreignKey: 'domain_id', as: 'domain' });

// Domain → Employee
db.Domain.hasMany(db.Employee, { foreignKey: 'business_id', as: 'employees' });
db.Employee.belongsTo(db.Domain, { foreignKey: 'business_id', as: 'business' });

// Domain → Task
db.Domain.hasMany(db.Task, { foreignKey: 'business_id', as: 'tasks' });
db.Task.belongsTo(db.Domain, { foreignKey: 'business_id', as: 'business' });

// Domain → Transaction
db.Domain.hasMany(db.Transaction, { foreignKey: 'business_id', as: 'transactions' });
db.Transaction.belongsTo(db.Domain, { foreignKey: 'business_id', as: 'business' });

// Domain → KPI
db.Domain.hasMany(db.KPI, { foreignKey: 'business_id', as: 'kpis' });
db.KPI.belongsTo(db.Domain, { foreignKey: 'business_id', as: 'business' });

// Domain → ComplianceRecord
db.Domain.hasMany(db.ComplianceRecord, { foreignKey: 'business_id', as: 'compliance_records' });
db.ComplianceRecord.belongsTo(db.Domain, { foreignKey: 'business_id', as: 'business' });

// Domain → OperationsAlert
db.Domain.hasMany(db.OperationsAlert, { foreignKey: 'business_id', as: 'operations_alerts' });
db.OperationsAlert.belongsTo(db.Domain, { foreignKey: 'business_id', as: 'business' });

// Shareholder → EquityHistory
db.Shareholder.hasMany(db.EquityHistory, { foreignKey: 'shareholder_id', as: 'equity_history' });
db.EquityHistory.belongsTo(db.Shareholder, { foreignKey: 'shareholder_id', as: 'shareholder' });

// Shareholder → PortalAccess
db.Shareholder.hasOne(db.PortalAccess, { foreignKey: 'shareholder_id', as: 'portal_access' });
db.PortalAccess.belongsTo(db.Shareholder, { foreignKey: 'shareholder_id', as: 'shareholder' });

// Employee → Attendance
db.Employee.hasMany(db.Attendance, { foreignKey: 'employee_id', as: 'attendance' });
db.Attendance.belongsTo(db.Employee, { foreignKey: 'employee_id', as: 'employee' });

// Employee self-ref (manager)
db.Employee.belongsTo(db.Employee, { foreignKey: 'manager_id', as: 'manager' });
db.Employee.hasMany(db.Employee, { foreignKey: 'manager_id', as: 'reports' });

// Employee → Task
db.Employee.hasMany(db.Task, { foreignKey: 'assignee_id', as: 'assigned_tasks' });
db.Task.belongsTo(db.Employee, { foreignKey: 'assignee_id', as: 'assignee' });

// Task → TaskComment
db.Task.hasMany(db.TaskComment, { foreignKey: 'task_id', as: 'comments', onDelete: 'CASCADE' });
db.TaskComment.belongsTo(db.Task, { foreignKey: 'task_id', as: 'task' });

// Employee → TaskComment (author)
db.Employee.hasMany(db.TaskComment, { foreignKey: 'author_id', as: 'task_comments' });
db.TaskComment.belongsTo(db.Employee, { foreignKey: 'author_id', as: 'author' });

module.exports = db;
