'use strict';
const { Sequelize } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    dialectOptions: { ssl: buildPgSsl() },
    logging: config.env === 'development' ? console.log : false,
    define: { underscored: true, timestamps: true },
});

const db = { sequelize, Sequelize };

db.Community = require('./community')(sequelize);
db.CommunityMembership = require('./community_membership')(sequelize);
db.CommunityInvite = require('./community_invite')(sequelize);
db.CommunityJoinRequest = require('./community_join_request')(sequelize);
db.CommunityModerationLog = require('./community_moderation_log')(sequelize);
db.CommunityBillingWebhookEvent = require('./community_billing_webhook_event')(sequelize);
db.CommunityChatMessage = require('./community_chat_message')(sequelize);
db.CommunityThread = require('./community_thread')(sequelize);
db.DirectConversation = require('./direct_conversation')(sequelize);
db.DirectMessage = require('./direct_message')(sequelize);
db.NightClub = require('./night_club')(sequelize);
db.ClubBooking = require('./club_booking')(sequelize);
db.LocalListing = require('./local_listing')(sequelize);
db.LocalApplication = require('./local_application')(sequelize);
db.NightProfile = require('./night_profile')(sequelize);
db.NightEmployer = require('./night_employer')(sequelize);
db.NightGig = require('./night_gig')(sequelize);
db.NightGigApplication = require('./night_gig_application')(sequelize);
db.NightContactReveal = require('./night_contact_reveal')(sequelize);
db.ClubEvent = require('./club_event')(sequelize);
db.EduTeacher = require('./edu_teacher')(sequelize);
db.EduSession = require('./edu_session')(sequelize);
db.EduEnrollment = require('./edu_enrollment')(sequelize);
db.EduReview = require('./edu_review')(sequelize);
db.KycVerification = require('./kyc_verification')(sequelize);
db.KycDocument = require('./kyc_document')(sequelize);
db.KycAccessLog = require('./kyc_access_log')(sequelize);
db.UserNotification = require('./user_notification')(sequelize);
db.NotificationContact = require('./notification_contact')(sequelize);
db.MediaAsset = require('./media_asset')(sequelize);
db.StaffMember = require('./staff_member')(sequelize);
db.AuditEvent = require('./audit_event')(sequelize);
db.SupportTicket = require('./support_ticket')(sequelize);
db.SupportMessage = require('./support_message')(sequelize);
db.Announcement = require('./announcement')(sequelize);
db.BountyTask = require('./bounty_task')(sequelize);
db.BountyParticipant = require('./bounty_participant')(sequelize);
db.BountyReport = require('./bounty_report')(sequelize);
db.BountyMessage = require('./bounty_message')(sequelize);

// Associations
db.Community.hasMany(db.CommunityMembership, { foreignKey: 'community_id', as: 'memberships' });
db.CommunityMembership.belongsTo(db.Community, { foreignKey: 'community_id', as: 'community' });

db.Community.hasMany(db.CommunityInvite, { foreignKey: 'community_id', as: 'invites' });
db.CommunityInvite.belongsTo(db.Community, { foreignKey: 'community_id', as: 'community' });

db.Community.hasMany(db.CommunityJoinRequest, { foreignKey: 'community_id', as: 'joinRequests' });
db.CommunityJoinRequest.belongsTo(db.Community, { foreignKey: 'community_id', as: 'community' });

db.Community.hasMany(db.CommunityModerationLog, { foreignKey: 'community_id', as: 'moderationLogs' });
db.CommunityModerationLog.belongsTo(db.Community, { foreignKey: 'community_id', as: 'community' });

db.Community.hasMany(db.CommunityChatMessage, { foreignKey: 'community_id', as: 'chatMessages' });

db.Community.hasMany(db.CommunityThread, { foreignKey: 'community_id', as: 'threads' });
db.CommunityThread.belongsTo(db.Community, { foreignKey: 'community_id', as: 'community' });
db.CommunityChatMessage.belongsTo(db.Community, { foreignKey: 'community_id', as: 'community' });

db.DirectConversation.hasMany(db.DirectMessage, { foreignKey: 'conversation_id', as: 'messages' });
db.DirectMessage.belongsTo(db.DirectConversation, { foreignKey: 'conversation_id', as: 'conversation' });

db.NightClub.hasMany(db.ClubBooking, { foreignKey: 'club_id', as: 'bookings' });
db.ClubBooking.belongsTo(db.NightClub, { foreignKey: 'club_id', as: 'club' });

db.LocalListing.hasMany(db.LocalApplication, { foreignKey: 'listing_id', as: 'applications' });
db.LocalApplication.belongsTo(db.LocalListing, { foreignKey: 'listing_id', as: 'listing' });

db.NightEmployer.hasMany(db.NightGig, { foreignKey: 'employer_id', as: 'gigs' });
db.NightGig.belongsTo(db.NightEmployer, { foreignKey: 'employer_id', as: 'employer' });

db.NightGig.hasMany(db.NightGigApplication, { foreignKey: 'gig_id', as: 'applications' });
db.NightGigApplication.belongsTo(db.NightGig, { foreignKey: 'gig_id', as: 'gig' });
db.NightProfile.hasMany(db.NightGigApplication, { foreignKey: 'profile_id', as: 'applications' });
db.NightGigApplication.belongsTo(db.NightProfile, { foreignKey: 'profile_id', as: 'profile' });

db.BountyTask.hasMany(db.BountyReport, { foreignKey: 'task_id', as: 'reports' });
db.BountyReport.belongsTo(db.BountyTask, { foreignKey: 'task_id', as: 'task' });

db.NightClub.hasMany(db.ClubEvent, { foreignKey: 'club_id', as: 'events' });
db.ClubEvent.belongsTo(db.NightClub, { foreignKey: 'club_id', as: 'club' });

db.EduTeacher.hasMany(db.EduSession, { foreignKey: 'teacher_id', as: 'sessions' });
db.EduSession.belongsTo(db.EduTeacher, { foreignKey: 'teacher_id', as: 'teacher' });
db.EduSession.hasMany(db.EduEnrollment, { foreignKey: 'session_id', as: 'enrollments' });
db.EduEnrollment.belongsTo(db.EduSession, { foreignKey: 'session_id', as: 'session' });
db.EduTeacher.hasMany(db.EduReview, { foreignKey: 'teacher_id', as: 'reviews' });
db.EduReview.belongsTo(db.EduTeacher, { foreignKey: 'teacher_id', as: 'teacher' });

db.KycVerification.hasMany(db.KycDocument, { foreignKey: 'verification_id', as: 'documents' });
db.KycDocument.belongsTo(db.KycVerification, { foreignKey: 'verification_id', as: 'verification' });

db.SupportTicket.hasMany(db.SupportMessage, { foreignKey: 'ticket_id', as: 'messages' });
db.SupportMessage.belongsTo(db.SupportTicket, { foreignKey: 'ticket_id', as: 'ticket' });

module.exports = db;
