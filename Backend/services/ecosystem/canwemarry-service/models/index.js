'use strict';
const { Sequelize, DataTypes, Op } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    dialectOptions: { ssl: buildPgSsl() },
    schema: config.db.schema,
    logging: false,
    define: { underscored: true, freezeTableName: true, schema: config.db.schema },
});

const db = { Sequelize, sequelize, Op };

const uuidPk = { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 };
const bothTs = { timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' };
const createdOnly = { timestamps: true, createdAt: 'created_at', updatedAt: false };

const def = (name, table, attrs, opts = {}) => sequelize.define(name, attrs, { tableName: table, ...opts });

// Enum-valued columns are TEXT with a CHECK constraint in SQL rather than a Postgres
// ENUM type: the states here (moderation, consent, report status) are expected to gain
// members, and widening a CHECK is a one-line migration where widening an ENUM is not.
// Sequelize sees them as strings; the Zod schemas at the edge are what reject bad input.

// ── Accounts ─────────────────────────────────────────────────────────────────
db.User = def('User', 'users', {
    // Local id, generated here. It is deliberately NOT the identity provider's subject:
    // auth-service issues a bigint, and coupling this schema to that format once already
    // broke provisioning (see migrations/003_platform_subject.sql).
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    // The `sub` claim, whatever shape the issuer uses.
    platform_subject: { type: DataTypes.TEXT, allowNull: false, unique: true },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'ACTIVE' },
    suspended_until: DataTypes.DATE,
    last_seen_at: DataTypes.DATE,
}, bothTs);

db.UserRole = def('UserRole', 'user_roles', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false },
    granted_by: DataTypes.UUID,
}, createdOnly);

/**
 * A member asking for supporter or volunteer standing. See migrations/006_role_requests.sql
 * for why the capability is not simply granted on sign-up.
 */
db.RoleRequest = def('RoleRequest', 'role_requests', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'PENDING' },
    decided_by: DataTypes.UUID,
    decided_at: DataTypes.DATE,
    decision_note: DataTypes.TEXT,
}, bothTs);

db.Profile = def('Profile', 'profiles', {
    user_id: { type: DataTypes.UUID, primaryKey: true },
    handle: { type: DataTypes.TEXT, allowNull: false, unique: true },
    display_name: DataTypes.TEXT,
    bio: DataTypes.TEXT,
    avatar_url: DataTypes.TEXT,
    country_code: DataTypes.CHAR(2),
    region: DataTypes.TEXT,
    languages: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
    is_discoverable: { type: DataTypes.BOOLEAN, defaultValue: false },
    show_location: { type: DataTypes.BOOLEAN, defaultValue: false },
    default_case_visibility: { type: DataTypes.STRING, defaultValue: 'PRIVATE' },
}, bothTs);

// ── Communities ──────────────────────────────────────────────────────────────
db.Community = def('Community', 'communities', {
    id: uuidPk,
    slug: { type: DataTypes.TEXT, allowNull: false, unique: true },
    name: { type: DataTypes.TEXT, allowNull: false },
    description: DataTypes.TEXT,
    visibility: { type: DataTypes.STRING, allowNull: false, defaultValue: 'PUBLIC' },
    join_policy: { type: DataTypes.STRING, allowNull: false, defaultValue: 'REQUEST' },
    country_code: DataTypes.CHAR(2),
    region: DataTypes.TEXT,
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    purpose: DataTypes.TEXT,
    rules: DataTypes.TEXT,
    created_by: DataTypes.UUID,
}, bothTs);

db.CommunityMember = def('CommunityMember', 'community_members', {
    id: uuidPk,
    community_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'MEMBER' },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'PENDING' },
    joined_at: DataTypes.DATE,
}, bothTs);

// ── Cases ────────────────────────────────────────────────────────────────────
db.Case = def('Case', 'cases', {
    id: uuidPk,
    reference: { type: DataTypes.TEXT, allowNull: false, unique: true },
    owner_id: { type: DataTypes.UUID, allowNull: false },
    community_id: DataTypes.UUID,
    title: { type: DataTypes.TEXT, allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: false },
    situation: DataTypes.TEXT,
    support_needed: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
    visibility: { type: DataTypes.STRING, allowNull: false, defaultValue: 'PRIVATE' },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'DRAFT' },
    moderation_state: { type: DataTypes.STRING, allowNull: false, defaultValue: 'VISIBLE' },
    country_code: DataTypes.CHAR(2),
    region: DataTypes.TEXT,
    allow_supporter_requests: { type: DataTypes.BOOLEAN, defaultValue: true },
    is_locked: { type: DataTypes.BOOLEAN, defaultValue: false },
    supporter_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    comment_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    resolved_at: DataTypes.DATE,
}, bothTs);

db.CaseParticipant = def('CaseParticipant', 'case_participants', {
    id: uuidPk,
    case_id: { type: DataTypes.UUID, allowNull: false },
    user_id: DataTypes.UUID,
    relation: { type: DataTypes.STRING, allowNull: false },
    consent_status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'INVITED' },
    invited_by: DataTypes.UUID,
    invited_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    responded_at: DataTypes.DATE,
}, bothTs);

db.CaseSupporter = def('CaseSupporter', 'case_supporters', {
    id: uuidPk,
    case_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'REQUESTED' },
    message: DataTypes.TEXT,
    responded_at: DataTypes.DATE,
}, bothTs);

db.CaseUpdate = def('CaseUpdate', 'case_updates', {
    id: uuidPk,
    case_id: { type: DataTypes.UUID, allowNull: false },
    author_id: { type: DataTypes.UUID, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
}, bothTs);

db.CaseInvitation = def('CaseInvitation', 'case_invitations', {
    id: uuidPk,
    case_id: { type: DataTypes.UUID, allowNull: false },
    // Only the hash is stored; the raw code is returned once, at creation.
    token_hash: { type: DataTypes.TEXT, allowNull: false, unique: true },
    relation: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'PENDING' },
    created_by: { type: DataTypes.UUID, allowNull: false },
    accepted_by: DataTypes.UUID,
    responded_at: DataTypes.DATE,
    expires_at: { type: DataTypes.DATE, allowNull: false },
}, bothTs);

// ── Discussion ───────────────────────────────────────────────────────────────
db.Post = def('Post', 'posts', {
    id: uuidPk,
    community_id: { type: DataTypes.UUID, allowNull: false },
    author_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.TEXT, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    moderation_state: { type: DataTypes.STRING, allowNull: false, defaultValue: 'VISIBLE' },
    is_locked: { type: DataTypes.BOOLEAN, defaultValue: false },
    comment_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    // Set when the author deletes it. The title and body are overwritten at the same time,
    // so the row survives as an addressable tombstone with no recoverable content.
    deleted_at: DataTypes.DATE,
}, bothTs);

db.Comment = def('Comment', 'comments', {
    id: uuidPk,
    target_type: { type: DataTypes.STRING, allowNull: false },
    target_id: { type: DataTypes.UUID, allowNull: false },
    parent_id: DataTypes.UUID,
    author_id: { type: DataTypes.UUID, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    moderation_state: { type: DataTypes.STRING, allowNull: false, defaultValue: 'VISIBLE' },
}, bothTs);

db.Reaction = def('Reaction', 'reactions', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    target_type: { type: DataTypes.STRING, allowNull: false },
    target_id: { type: DataTypes.UUID, allowNull: false },
    kind: { type: DataTypes.STRING, allowNull: false },
}, createdOnly);

// ── Notifications, safety, resources, audit ──────────────────────────────────
db.Notification = def('Notification', 'notifications', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.TEXT, allowNull: false },
    title: { type: DataTypes.TEXT, allowNull: false },
    body: DataTypes.TEXT,
    link: DataTypes.TEXT,
    read_at: DataTypes.DATE,
}, createdOnly);

db.Report = def('Report', 'reports', {
    id: uuidPk,
    reporter_id: DataTypes.UUID,
    target_type: { type: DataTypes.STRING, allowNull: false },
    target_id: { type: DataTypes.UUID, allowNull: false },
    reason: { type: DataTypes.STRING, allowNull: false },
    details: DataTypes.TEXT,
    severity: { type: DataTypes.STRING, allowNull: false, defaultValue: 'NORMAL' },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'OPEN' },
    assigned_to: DataTypes.UUID,
    resolution_note: DataTypes.TEXT,
    resolved_at: DataTypes.DATE,
}, bothTs);

db.ModerationAction = def('ModerationAction', 'moderation_actions', {
    id: uuidPk,
    actor_id: DataTypes.UUID,
    report_id: DataTypes.UUID,
    target_type: { type: DataTypes.STRING, allowNull: false },
    target_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    expires_at: DataTypes.DATE,
}, createdOnly);

db.Resource = def('Resource', 'resources', {
    id: uuidPk,
    slug: { type: DataTypes.TEXT, allowNull: false, unique: true },
    title: { type: DataTypes.TEXT, allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: false },
    body: DataTypes.TEXT,
    category: { type: DataTypes.STRING, allowNull: false },
    country_code: DataTypes.CHAR(2),
    region: DataTypes.TEXT,
    url: DataTypes.TEXT,
    provider_name: DataTypes.TEXT,
    is_published: { type: DataTypes.BOOLEAN, defaultValue: false },
    published_at: DataTypes.DATE,
    created_by: DataTypes.UUID,
}, bothTs);

db.AuditLog = def('AuditLog', 'audit_logs', {
    id: uuidPk,
    actor_id: DataTypes.UUID,
    actor_roles: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
    action: { type: DataTypes.TEXT, allowNull: false },
    entity_type: DataTypes.TEXT,
    entity_id: DataTypes.UUID,
    request_id: DataTypes.TEXT,
    ip_hash: DataTypes.TEXT,
    user_agent_hash: DataTypes.TEXT,
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
}, createdOnly);

// ── Associations ─────────────────────────────────────────────────────────────
// Declared for eager loading only. The delete/update behaviour that actually runs is
// the ON DELETE clause in 001_init.sql — Sequelize never owns this schema's DDL.
db.User.hasOne(db.Profile, { foreignKey: 'user_id', as: 'profile' });
db.Profile.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.User.hasMany(db.UserRole, { foreignKey: 'user_id', as: 'roles' });
db.RoleRequest.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.UserRole.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

db.Community.hasMany(db.CommunityMember, { foreignKey: 'community_id', as: 'members' });
db.CommunityMember.belongsTo(db.Community, { foreignKey: 'community_id', as: 'community' });
db.Community.hasMany(db.Case, { foreignKey: 'community_id', as: 'cases' });
db.Community.hasMany(db.Post, { foreignKey: 'community_id', as: 'posts' });

db.Case.belongsTo(db.User, { foreignKey: 'owner_id', as: 'owner' });
db.Case.belongsTo(db.Community, { foreignKey: 'community_id', as: 'community' });
db.Case.hasMany(db.CaseParticipant, { foreignKey: 'case_id', as: 'participants' });
db.Case.hasMany(db.CaseSupporter, { foreignKey: 'case_id', as: 'supporters' });
db.Case.hasMany(db.CaseUpdate, { foreignKey: 'case_id', as: 'updates' });
db.Case.hasMany(db.CaseInvitation, { foreignKey: 'case_id', as: 'invitations' });
db.CaseParticipant.belongsTo(db.Case, { foreignKey: 'case_id', as: 'case' });
db.CaseSupporter.belongsTo(db.Case, { foreignKey: 'case_id', as: 'case' });

db.Post.belongsTo(db.User, { foreignKey: 'author_id', as: 'author' });
db.Comment.belongsTo(db.User, { foreignKey: 'author_id', as: 'author' });
db.Comment.hasMany(db.Comment, { foreignKey: 'parent_id', as: 'replies' });

db.Report.belongsTo(db.User, { foreignKey: 'reporter_id', as: 'reporter' });
db.ModerationAction.belongsTo(db.Report, { foreignKey: 'report_id', as: 'report' });

module.exports = db;
