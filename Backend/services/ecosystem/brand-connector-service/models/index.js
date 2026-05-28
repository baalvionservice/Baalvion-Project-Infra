'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: config.env === 'development' ? console.log : false,
    define: { underscored: true, timestamps: true },
});

const db = { sequelize, Sequelize };

// ── Existing models ────────────────────────────────────────────────────────────
db.BrandProfile = require('./brand_profiles')(sequelize, DataTypes);
db.InfluencerProfile = require('./influencer_profiles')(sequelize, DataTypes);
db.Campaign = require('./campaigns')(sequelize, DataTypes);
db.CampaignApplication = require('./campaign_applications')(sequelize, DataTypes);
db.Partnership = require('./partnerships')(sequelize, DataTypes);
db.Deliverable = require('./deliverables')(sequelize, DataTypes);

// ── New models ─────────────────────────────────────────────────────────────────
db.Lead = require('./leads')(sequelize);
db.LeadNote = require('./lead_notes')(sequelize);
db.Deal = require('./deals')(sequelize);
db.DealNote = require('./deal_notes')(sequelize);
db.Proposal = require('./proposals')(sequelize);
db.Payment = require('./payments')(sequelize);
db.OutreachCampaign = require('./outreach_campaigns')(sequelize);
db.OutreachMessage = require('./outreach_messages')(sequelize);
db.ScrapeSession = require('./scrape_sessions')(sequelize);
db.ScrapedLead = require('./scraped_leads')(sequelize);
db.Plan = require('./plans')(sequelize);
db.Subscription = require('./subscriptions')(sequelize);
db.Invoice = require('./invoices')(sequelize);
db.TeamMember = require('./team_members')(sequelize);
db.Notification = require('./notifications')(sequelize);
db.OnboardingState = require('./onboarding_states')(sequelize);
db.AutomationRule = require('./automation_rules')(sequelize);
db.Dispute = require('./disputes')(sequelize);
db.SystemLog = require('./system_logs')(sequelize);

// ── Existing associations ──────────────────────────────────────────────────────
db.BrandProfile.hasMany(db.Campaign, { foreignKey: 'brand_id', as: 'campaigns' });
db.Campaign.belongsTo(db.BrandProfile, { foreignKey: 'brand_id', as: 'brand' });

db.Campaign.hasMany(db.CampaignApplication, { foreignKey: 'campaign_id', as: 'applications' });
db.CampaignApplication.belongsTo(db.Campaign, { foreignKey: 'campaign_id', as: 'campaign' });

db.InfluencerProfile.hasMany(db.CampaignApplication, { foreignKey: 'influencer_id', as: 'applications' });
db.CampaignApplication.belongsTo(db.InfluencerProfile, { foreignKey: 'influencer_id', as: 'influencer' });

db.BrandProfile.hasMany(db.Partnership, { foreignKey: 'brand_id', as: 'partnerships' });
db.Partnership.belongsTo(db.BrandProfile, { foreignKey: 'brand_id', as: 'brand' });

db.InfluencerProfile.hasMany(db.Partnership, { foreignKey: 'influencer_id', as: 'partnerships' });
db.Partnership.belongsTo(db.InfluencerProfile, { foreignKey: 'influencer_id', as: 'influencer' });

db.Campaign.hasMany(db.Partnership, { foreignKey: 'campaign_id', as: 'partnerships' });
db.Partnership.belongsTo(db.Campaign, { foreignKey: 'campaign_id', as: 'campaign' });

db.Partnership.hasMany(db.Deliverable, { foreignKey: 'partnership_id', as: 'deliverableItems' });
db.Deliverable.belongsTo(db.Partnership, { foreignKey: 'partnership_id', as: 'partnership' });

// ── New associations ───────────────────────────────────────────────────────────
db.Lead.hasMany(db.LeadNote, { foreignKey: 'lead_id', as: 'notes' });
db.LeadNote.belongsTo(db.Lead, { foreignKey: 'lead_id', as: 'lead' });

db.Lead.hasMany(db.Deal, { foreignKey: 'lead_id', as: 'deals' });
db.Deal.belongsTo(db.Lead, { foreignKey: 'lead_id', as: 'lead' });

db.Deal.hasMany(db.DealNote, { foreignKey: 'deal_id', as: 'notes' });
db.DealNote.belongsTo(db.Deal, { foreignKey: 'deal_id', as: 'deal' });

db.Deal.hasMany(db.Proposal, { foreignKey: 'deal_id', as: 'proposals' });
db.Proposal.belongsTo(db.Deal, { foreignKey: 'deal_id', as: 'deal' });

db.Proposal.hasMany(db.Payment, { foreignKey: 'proposal_id', as: 'payments' });
db.Payment.belongsTo(db.Proposal, { foreignKey: 'proposal_id', as: 'proposal' });

db.Deal.hasMany(db.Payment, { foreignKey: 'deal_id', as: 'payments' });
db.Payment.belongsTo(db.Deal, { foreignKey: 'deal_id', as: 'deal' });

db.OutreachCampaign.hasMany(db.OutreachMessage, { foreignKey: 'campaign_id', as: 'messages' });
db.OutreachMessage.belongsTo(db.OutreachCampaign, { foreignKey: 'campaign_id', as: 'campaign' });

db.Lead.hasMany(db.OutreachMessage, { foreignKey: 'lead_id', as: 'outreach_messages' });
db.OutreachMessage.belongsTo(db.Lead, { foreignKey: 'lead_id', as: 'lead' });

db.ScrapeSession.hasMany(db.ScrapedLead, { foreignKey: 'session_id', as: 'scraped_leads' });
db.ScrapedLead.belongsTo(db.ScrapeSession, { foreignKey: 'session_id', as: 'session' });

db.Plan.hasMany(db.Subscription, { foreignKey: 'plan_id', as: 'subscriptions' });
db.Subscription.belongsTo(db.Plan, { foreignKey: 'plan_id', as: 'plan' });

db.Subscription.hasMany(db.Invoice, { foreignKey: 'subscription_id', as: 'invoices' });
db.Invoice.belongsTo(db.Subscription, { foreignKey: 'subscription_id', as: 'subscription' });

module.exports = db;
