var DataTypes = require("sequelize").DataTypes;
var _presets = require("./presets");
var _abuse_logs = require("./abuse_logs");
var _api_keys = require("./api_keys");
var _api_key_scopes = require("./api_key_scopes");
var _audit_logs = require("./audit_logs");
var _auth_audit_logs = require("./auth_audit_logs");
var _failed_auth_attempts = require("./failed_auth_attempts");
var _proxy_sessions = require("./proxy_sessions");
var _chargebacks = require("./chargebacks");
var _feature_flags = require("./feature_flags");
var _invoices = require("./invoices");
var _notifications = require("./notifications");
var _org_memberships = require("./org_memberships");
var _organizations = require("./organizations");
var _payment_methods = require("./payment_methods");
var _plans = require("./plans");
var _provider_health = require("./provider_health");
var _provider_incidents = require("./provider_incidents");
var _providers = require("./providers");
var _proxies = require("./proxies");
var _proxy_usage_logs = require("./proxy_usage_logs");
var _refresh_tokens = require("./refresh_tokens");
var _routing_rules = require("./routing_rules");
var _sessions = require("./sessions");
var _sub_users = require("./sub_users");
var _subscriptions = require("./subscriptions");
var _support_tickets = require("./support_tickets");
var _system_incidents = require("./system_incidents");
var _ticket_messages = require("./ticket_messages");
var _transactions = require("./transactions");
var _usage_records = require("./usage_records");
var _users = require("./users");
var _webhook_logs = require("./webhook_logs");

function initModels(sequelize) {
  var presets = _presets(sequelize, DataTypes);
  var abuse_logs = _abuse_logs(sequelize, DataTypes);
  var api_keys = _api_keys(sequelize, DataTypes);
  var api_key_scopes = _api_key_scopes(sequelize, DataTypes);
  var audit_logs = _audit_logs(sequelize, DataTypes);
  var auth_audit_logs = _auth_audit_logs(sequelize, DataTypes);
  var failed_auth_attempts = _failed_auth_attempts(sequelize, DataTypes);
  var proxy_sessions = _proxy_sessions(sequelize, DataTypes);
  var chargebacks = _chargebacks(sequelize, DataTypes);
  var feature_flags = _feature_flags(sequelize, DataTypes);
  var invoices = _invoices(sequelize, DataTypes);
  var notifications = _notifications(sequelize, DataTypes);
  var org_memberships = _org_memberships(sequelize, DataTypes);
  var organizations = _organizations(sequelize, DataTypes);
  var payment_methods = _payment_methods(sequelize, DataTypes);
  var plans = _plans(sequelize, DataTypes);
  var provider_health = _provider_health(sequelize, DataTypes);
  var provider_incidents = _provider_incidents(sequelize, DataTypes);
  var providers = _providers(sequelize, DataTypes);
  var proxies = _proxies(sequelize, DataTypes);
  var proxy_usage_logs = _proxy_usage_logs(sequelize, DataTypes);
  var refresh_tokens = _refresh_tokens(sequelize, DataTypes);
  var routing_rules = _routing_rules(sequelize, DataTypes);
  var sessions = _sessions(sequelize, DataTypes);
  var sub_users = _sub_users(sequelize, DataTypes);
  var subscriptions = _subscriptions(sequelize, DataTypes);
  var support_tickets = _support_tickets(sequelize, DataTypes);
  var system_incidents = _system_incidents(sequelize, DataTypes);
  var ticket_messages = _ticket_messages(sequelize, DataTypes);
  var transactions = _transactions(sequelize, DataTypes);
  var usage_records = _usage_records(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);
  var webhook_logs = _webhook_logs(sequelize, DataTypes);

  presets.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(presets, { as: "presets", foreignKey: "org_id"});

  abuse_logs.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(abuse_logs, { as: "abuse_logs", foreignKey: "org_id"});
  api_keys.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(api_keys, { as: "api_keys", foreignKey: "org_id"});
  api_key_scopes.belongsTo(api_keys, { as: "api_key", foreignKey: "api_key_id"});
  api_keys.hasMany(api_key_scopes, { as: "scopes", foreignKey: "api_key_id"});
  proxy_sessions.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(proxy_sessions, { as: "proxy_sessions", foreignKey: "org_id"});
  proxy_sessions.belongsTo(api_keys, { as: "api_key", foreignKey: "api_key_id"});
  api_keys.hasMany(proxy_sessions, { as: "proxy_sessions", foreignKey: "api_key_id"});
  audit_logs.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(audit_logs, { as: "audit_logs", foreignKey: "org_id"});
  invoices.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(invoices, { as: "invoices", foreignKey: "org_id"});
  notifications.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(notifications, { as: "notifications", foreignKey: "org_id"});
  org_memberships.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(org_memberships, { as: "org_memberships", foreignKey: "org_id"});
  payment_methods.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(payment_methods, { as: "payment_methods", foreignKey: "org_id"});
  proxies.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(proxies, { as: "proxies", foreignKey: "org_id"});
  proxy_usage_logs.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(proxy_usage_logs, { as: "proxy_usage_logs", foreignKey: "org_id"});
  refresh_tokens.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(refresh_tokens, { as: "refresh_tokens", foreignKey: "org_id"});
  sessions.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(sessions, { as: "sessions", foreignKey: "org_id"});
  sub_users.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(sub_users, { as: "sub_users", foreignKey: "org_id"});
  subscriptions.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(subscriptions, { as: "subscriptions", foreignKey: "org_id"});
  support_tickets.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(support_tickets, { as: "support_tickets", foreignKey: "org_id"});
  ticket_messages.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(ticket_messages, { as: "ticket_messages", foreignKey: "org_id"});
  transactions.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(transactions, { as: "transactions", foreignKey: "org_id"});
  usage_records.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(usage_records, { as: "usage_records", foreignKey: "org_id"});
  users.belongsTo(organizations, { as: "org", foreignKey: "org_id"});
  organizations.hasMany(users, { as: "users", foreignKey: "org_id"});
  subscriptions.belongsTo(plans, { as: "plan", foreignKey: "plan_id"});
  plans.hasMany(subscriptions, { as: "subscriptions", foreignKey: "plan_id"});
  users.belongsTo(plans, { as: "plan", foreignKey: "plan_id"});
  plans.hasMany(users, { as: "users", foreignKey: "plan_id"});
  provider_health.belongsTo(providers, { as: "provider", foreignKey: "provider_id"});
  providers.hasMany(provider_health, { as: "provider_healths", foreignKey: "provider_id"});
  provider_incidents.belongsTo(providers, { as: "provider", foreignKey: "provider_id"});
  providers.hasMany(provider_incidents, { as: "provider_incidents", foreignKey: "provider_id"});
  proxies.belongsTo(providers, { as: "provider", foreignKey: "provider_id"});
  providers.hasMany(proxies, { as: "proxies", foreignKey: "provider_id"});
  routing_rules.belongsTo(providers, { as: "provider", foreignKey: "provider_id"});
  providers.hasMany(routing_rules, { as: "routing_rules", foreignKey: "provider_id"});
  proxy_usage_logs.belongsTo(proxies, { as: "proxy", foreignKey: "proxy_id"});
  proxies.hasMany(proxy_usage_logs, { as: "proxy_usage_logs", foreignKey: "proxy_id"});
  invoices.belongsTo(subscriptions, { as: "subscription", foreignKey: "subscription_id"});
  subscriptions.hasMany(invoices, { as: "invoices", foreignKey: "subscription_id"});
  ticket_messages.belongsTo(support_tickets, { as: "ticket", foreignKey: "ticket_id"});
  support_tickets.hasMany(ticket_messages, { as: "ticket_messages", foreignKey: "ticket_id"});
  chargebacks.belongsTo(transactions, { as: "transaction", foreignKey: "transaction_id"});
  transactions.hasMany(chargebacks, { as: "chargebacks", foreignKey: "transaction_id"});
  abuse_logs.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(abuse_logs, { as: "abuse_logs", foreignKey: "user_id"});
  api_keys.belongsTo(users, { as: "created_by_user", foreignKey: "created_by"});
  users.hasMany(api_keys, { as: "api_keys", foreignKey: "created_by"});
  audit_logs.belongsTo(users, { as: "admin", foreignKey: "admin_id"});
  users.hasMany(audit_logs, { as: "audit_logs", foreignKey: "admin_id"});
  invoices.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(invoices, { as: "invoices", foreignKey: "user_id"});
  org_memberships.belongsTo(users, { as: "invited_by_user", foreignKey: "invited_by"});
  users.hasMany(org_memberships, { as: "org_memberships", foreignKey: "invited_by"});
  org_memberships.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(org_memberships, { as: "user_org_memberships", foreignKey: "user_id"});
  payment_methods.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(payment_methods, { as: "payment_methods", foreignKey: "user_id"});
  proxy_usage_logs.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(proxy_usage_logs, { as: "proxy_usage_logs", foreignKey: "user_id"});
  refresh_tokens.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(refresh_tokens, { as: "refresh_tokens", foreignKey: "user_id"});
  sessions.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(sessions, { as: "sessions", foreignKey: "user_id"});
  sub_users.belongsTo(users, { as: "parent_user", foreignKey: "parent_user_id"});
  users.hasMany(sub_users, { as: "sub_users", foreignKey: "parent_user_id"});
  subscriptions.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(subscriptions, { as: "subscriptions", foreignKey: "user_id"});
  ticket_messages.belongsTo(users, { as: "author_user", foreignKey: "author_user_id"});
  users.hasMany(ticket_messages, { as: "ticket_messages", foreignKey: "author_user_id"});
  transactions.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(transactions, { as: "transactions", foreignKey: "user_id"});

  return {
    presets,
    abuse_logs,
    api_keys,
    api_key_scopes,
    audit_logs,
    auth_audit_logs,
    failed_auth_attempts,
    proxy_sessions,
    chargebacks,
    feature_flags,
    invoices,
    notifications,
    org_memberships,
    organizations,
    payment_methods,
    plans,
    provider_health,
    provider_incidents,
    providers,
    proxies,
    proxy_usage_logs,
    refresh_tokens,
    routing_rules,
    sessions,
    sub_users,
    subscriptions,
    support_tickets,
    system_incidents,
    ticket_messages,
    transactions,
    usage_records,
    users,
    webhook_logs,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
