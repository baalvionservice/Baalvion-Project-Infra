-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MfaMethod" AS ENUM ('TOTP', 'SMS', 'WEBAUTHN');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('INVESTOR_INDIVIDUAL', 'INVESTOR_ENTITY', 'COMPANY', 'PLATFORM');

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER', 'COMPLIANCE');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "InvestorType" AS ENUM ('ANGEL', 'VENTURE_CAPITAL', 'PRIVATE_EQUITY', 'FAMILY_OFFICE', 'INSTITUTIONAL', 'CORPORATE', 'SYNDICATE', 'RETAIL');

-- CreateEnum
CREATE TYPE "RiskAppetite" AS ENUM ('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE');

-- CreateEnum
CREATE TYPE "AccreditationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AccreditationMethod" AS ENUM ('INCOME', 'NET_WORTH', 'PROFESSIONAL_CERT', 'THIRD_PARTY_LETTER', 'ENTITY');

-- CreateEnum
CREATE TYPE "CompanyStage" AS ENUM ('IDEA', 'STARTUP', 'SME', 'GROWTH', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AmlStatus" AS ENUM ('CLEAR', 'PENDING', 'REVIEW', 'FLAGGED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ComplianceCaseType" AS ENUM ('ABUSE', 'DISPUTE', 'SANCTIONS_HIT', 'PEP_REVIEW', 'SOURCE_OF_FUNDS', 'MANUAL');

-- CreateEnum
CREATE TYPE "ComplianceCaseStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'ESCALATED', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OpportunityStage" AS ENUM ('PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'GROWTH', 'BRIDGE', 'SECONDARY');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'LIVE', 'PAUSED', 'CLOSED', 'FUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OpportunityVisibility" AS ENUM ('PRIVATE', 'INVITE_ONLY', 'PUBLIC');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SUGGESTED', 'VIEWED', 'DISMISSED', 'ACTIONED');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('OPEN', 'DUE_DILIGENCE', 'NEGOTIATING', 'TERM_SHEET', 'SIGNING', 'FUNDING', 'CLOSED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DealMemberRole" AS ENUM ('LEAD', 'PARTICIPANT', 'ADVISOR', 'LEGAL', 'OBSERVER');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('FINANCIAL', 'LEGAL', 'IP', 'BUSINESS_PLAN', 'CAP_TABLE', 'DECK', 'TAX', 'OPERATIONAL', 'COMPLIANCE', 'AGREEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('PRIVATE', 'NDA_GATED', 'APPROVED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "AccessCondition" AS ENUM ('NONE', 'KYC', 'NDA', 'VERIFIED', 'APPROVED');

-- CreateEnum
CREATE TYPE "DocAccessAction" AS ENUM ('VIEW', 'PREVIEW', 'DOWNLOAD');

-- CreateEnum
CREATE TYPE "VirusScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "DueDiligenceCategory" AS ENUM ('FINANCIAL', 'LEGAL', 'OPERATIONAL', 'COMPLIANCE', 'TECHNICAL', 'MARKET');

-- CreateEnum
CREATE TYPE "DueDiligenceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETE', 'FLAGGED');

-- CreateEnum
CREATE TYPE "DocumentRequestStatus" AS ENUM ('REQUESTED', 'UPLOADED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TermSheetStatus" AS ENUM ('DRAFT', 'SENT', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TermSheetAction" AS ENUM ('PROPOSE', 'COUNTER', 'ACCEPT', 'REJECT');

-- CreateEnum
CREATE TYPE "SecurityType" AS ENUM ('EQUITY', 'PREFERRED', 'SAFE', 'CONVERTIBLE_NOTE', 'DEBT', 'REVENUE_SHARE', 'WARRANT');

-- CreateEnum
CREATE TYPE "SignatureProvider" AS ENUM ('DOCUSIGN', 'ADOBE_SIGN', 'DROPBOX_SIGN', 'INTERNAL');

-- CreateEnum
CREATE TYPE "SignatureStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'SIGNED', 'DECLINED', 'EXPIRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('COMMITTED', 'FUNDING', 'FUNDED', 'ACTIVE', 'EXITED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CapTableHolderType" AS ENUM ('FOUNDER', 'INVESTOR', 'ESOP', 'OTHER');

-- CreateEnum
CREATE TYPE "CapTableEventType" AS ENUM ('ISSUE', 'TRANSFER', 'DILUTION', 'CONVERSION', 'BUYBACK');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('INITIATED', 'FUNDED', 'RELEASE_PENDING', 'RELEASED', 'REFUNDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "EscrowTxnType" AS ENUM ('FUND', 'RELEASE', 'REFUND', 'FEE');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'WISE', 'INTERNAL');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CARD', 'BANK_ACCOUNT', 'WALLET');

-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PayoutType" AS ENUM ('DIVIDEND', 'INTEREST', 'RETURN_OF_CAPITAL', 'CAPITAL_GAIN', 'EXIT_PROCEEDS');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "ValuationSource" AS ENUM ('FUNDING_ROUND', 'COMPANY_REPORTED', 'PLATFORM_ESTIMATE', 'SECONDARY_TRADE', 'EXIT');

-- CreateEnum
CREATE TYPE "TaxDocType" AS ENUM ('FORM_1099', 'SCHEDULE_K1', 'FORM_1042S', 'CRS', 'FATCA', 'OTHER');

-- CreateEnum
CREATE TYPE "TaxDocStatus" AS ENUM ('PENDING', 'GENERATED', 'ISSUED', 'AMENDED');

-- CreateEnum
CREATE TYPE "SecondaryListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'MATCHED', 'SETTLED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SecondaryOrderSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "SecondaryOrderStatus" AS ENUM ('OPEN', 'MATCHED', 'FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ');

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "legalName" TEXT NOT NULL,
    "brandName" TEXT,
    "registrationNo" TEXT,
    "country" VARCHAR(2),
    "industryCode" TEXT,
    "stage" "CompanyStage" NOT NULL DEFAULT 'STARTUP',
    "status" "CompanyStatus" NOT NULL DEFAULT 'DRAFT',
    "websiteUrl" TEXT,
    "foundedYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "summary" TEXT,
    "problem" TEXT,
    "solution" TEXT,
    "tractionJson" JSONB,
    "teamSize" INTEGER,
    "fundingRaised" DECIMAL(20,4),
    "fundingTarget" DECIMAL(20,4),
    "valuationTarget" DECIMAL(20,4),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "deckDocumentId" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Founder" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "linkedinUrl" TEXT,
    "equityPct" DECIMAL(7,4),
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Founder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "companyOrgId" UUID NOT NULL,
    "round" "OpportunityStage" NOT NULL,
    "amountSought" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "preMoneyValuation" DECIMAL(20,4),
    "equityOfferedPct" DECIMAL(7,4),
    "securityType" "SecurityType" NOT NULL DEFAULT 'EQUITY',
    "minTicket" DECIMAL(20,4),
    "deadline" TIMESTAMP(3),
    "status" "OpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "OpportunityVisibility" NOT NULL DEFAULT 'PRIVATE',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "investorOrgId" UUID NOT NULL,
    "score" DECIMAL(6,4) NOT NULL,
    "reasonsJson" JSONB,
    "modelVersion" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'SUGGESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" UUID NOT NULL,
    "investorOrgId" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" UUID NOT NULL,
    "opportunityId" UUID,
    "companyOrgId" UUID NOT NULL,
    "investorOrgId" UUID NOT NULL,
    "leadInvestorUserId" UUID,
    "status" "DealStatus" NOT NULL DEFAULT 'OPEN',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealMember" (
    "id" UUID NOT NULL,
    "dealId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "role" "DealMemberRole" NOT NULL DEFAULT 'PARTICIPANT',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealMessage" (
    "id" UUID NOT NULL,
    "dealId" UUID NOT NULL,
    "senderUserId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentsJson" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdaAgreement" (
    "id" UUID NOT NULL,
    "dealId" UUID NOT NULL,
    "partyOrgId" UUID NOT NULL,
    "templateId" TEXT,
    "status" "SignatureStatus" NOT NULL DEFAULT 'SENT',
    "signatureEnvelopeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdaAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "dealId" UUID,
    "companyId" UUID,
    "category" "DocumentCategory" NOT NULL,
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'PRIVATE',
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "s3Bucket" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "checksumSha256" TEXT,
    "encryptionKeyId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentDocumentId" UUID,
    "virusScanStatus" "VirusScanStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAccessGrant" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "granteeOrgId" UUID,
    "granteeUserId" UUID,
    "condition" "AccessCondition" NOT NULL DEFAULT 'NONE',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAccessLog" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" "DocAccessAction" NOT NULL,
    "ipAddress" TEXT,
    "watermarkId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DueDiligenceItem" (
    "id" UUID NOT NULL,
    "dealId" UUID NOT NULL,
    "category" "DueDiligenceCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "DueDiligenceStatus" NOT NULL DEFAULT 'OPEN',
    "evidenceDocumentId" UUID,
    "assigneeUserId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DueDiligenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRequest" (
    "id" UUID NOT NULL,
    "dealId" UUID NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DocumentRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedByUserId" UUID NOT NULL,
    "fulfilledDocumentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "emailVerifiedAt" TIMESTAMP(3),
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "country" VARCHAR(2),
    "locale" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaCredential" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "method" "MfaMethod" NOT NULL,
    "secret" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "backupCodes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "type" "OrgType" NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT,
    "registrationNo" TEXT,
    "country" VARCHAR(2),
    "status" "OrgStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "invitedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermSheet" (
    "id" UUID NOT NULL,
    "dealId" UUID NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "TermSheetStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermSheetVersion" (
    "id" UUID NOT NULL,
    "termSheetId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "equityPct" DECIMAL(7,4),
    "valuation" DECIMAL(20,4),
    "securityType" "SecurityType" NOT NULL DEFAULT 'EQUITY',
    "boardRightsJson" JSONB,
    "investorRightsJson" JSONB,
    "exitRightsJson" JSONB,
    "action" "TermSheetAction" NOT NULL,
    "authorUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermSheetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureEnvelope" (
    "id" UUID NOT NULL,
    "dealId" UUID,
    "documentId" UUID,
    "provider" "SignatureProvider" NOT NULL DEFAULT 'INTERNAL',
    "externalRef" TEXT,
    "status" "SignatureStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SignatureEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureParty" (
    "id" UUID NOT NULL,
    "envelopeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "status" "SignatureStatus" NOT NULL DEFAULT 'SENT',
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "SignatureParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" UUID NOT NULL,
    "dealId" UUID NOT NULL,
    "investorOrgId" UUID NOT NULL,
    "companyOrgId" UUID NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "securityType" "SecurityType" NOT NULL DEFAULT 'EQUITY',
    "shares" DECIMAL(24,6),
    "pricePerShare" DECIMAL(20,8),
    "ownershipPct" DECIMAL(7,4),
    "status" "InvestmentStatus" NOT NULL DEFAULT 'COMMITTED',
    "committedAt" TIMESTAMP(3),
    "fundedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" UUID NOT NULL,
    "investmentId" UUID NOT NULL,
    "investorOrgId" UUID NOT NULL,
    "companyOrgId" UUID NOT NULL,
    "securityType" "SecurityType" NOT NULL,
    "shares" DECIMAL(24,6) NOT NULL,
    "costBasis" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapTableEntry" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "holderType" "CapTableHolderType" NOT NULL,
    "holderOrgId" UUID,
    "securityType" "SecurityType" NOT NULL,
    "shares" DECIMAL(24,6) NOT NULL,
    "ownershipPct" DECIMAL(7,4) NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapTableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapTableEvent" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "dealId" UUID,
    "type" "CapTableEventType" NOT NULL,
    "deltaJson" JSONB NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapTableEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorProfile" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "type" "InvestorType" NOT NULL,
    "thesis" TEXT,
    "aumBand" TEXT,
    "website" TEXT,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentPreference" (
    "id" UUID NOT NULL,
    "investorProfileId" UUID NOT NULL,
    "industries" TEXT[],
    "stages" TEXT[],
    "geographies" TEXT[],
    "ticketMin" DECIMAL(20,4),
    "ticketMax" DECIMAL(20,4),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "riskAppetite" "RiskAppetite" NOT NULL DEFAULT 'MODERATE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Accreditation" (
    "id" UUID NOT NULL,
    "investorProfileId" UUID NOT NULL,
    "method" "AccreditationMethod" NOT NULL,
    "status" "AccreditationStatus" NOT NULL DEFAULT 'PENDING',
    "jurisdiction" VARCHAR(2) NOT NULL,
    "evidenceDocumentId" UUID,
    "reviewerUserId" UUID,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accreditation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "template" TEXT NOT NULL,
    "subject" TEXT,
    "payloadJson" JSONB NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "orgId" UUID,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "metaJson" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowAccount" (
    "id" UUID NOT NULL,
    "dealId" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'STRIPE',
    "externalRef" TEXT,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "balance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "status" "EscrowStatus" NOT NULL DEFAULT 'INITIATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowTransaction" (
    "id" UUID NOT NULL,
    "escrowAccountId" UUID NOT NULL,
    "type" "EscrowTxnType" NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "releaseConditionsJson" JSONB,
    "paymentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscrowTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "externalRef" TEXT NOT NULL,
    "brand" TEXT,
    "last4" VARCHAR(4),
    "currency" VARCHAR(3),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "investmentId" UUID,
    "escrowAccountId" UUID,
    "provider" "PaymentProvider" NOT NULL,
    "direction" "PaymentDirection" NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "feeAmount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "externalRef" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" UUID NOT NULL,
    "companyOrgId" UUID NOT NULL,
    "investorOrgId" UUID NOT NULL,
    "investmentId" UUID,
    "type" "PayoutType" NOT NULL,
    "grossAmount" DECIMAL(20,4) NOT NULL,
    "taxWithheld" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" UUID,
    "scheduledAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" UUID NOT NULL,
    "orgId" UUID,
    "account" TEXT NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "refType" TEXT NOT NULL,
    "refId" UUID NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Valuation" (
    "id" UUID NOT NULL,
    "companyOrgId" UUID NOT NULL,
    "investmentId" UUID,
    "navPerShare" DECIMAL(20,8),
    "totalValue" DECIMAL(20,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "source" "ValuationSource" NOT NULL DEFAULT 'PLATFORM_ESTIMATE',
    "asOf" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Valuation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnSnapshot" (
    "id" UUID NOT NULL,
    "investorOrgId" UUID NOT NULL,
    "investmentId" UUID,
    "irr" DECIMAL(10,6),
    "moic" DECIMAL(10,4),
    "unrealizedValue" DECIMAL(20,4) NOT NULL,
    "realizedValue" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "asOf" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDocument" (
    "id" UUID NOT NULL,
    "investorOrgId" UUID NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "type" "TaxDocType" NOT NULL,
    "jurisdiction" VARCHAR(2) NOT NULL,
    "documentId" UUID,
    "status" "TaxDocStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecondaryListing" (
    "id" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "sellerOrgId" UUID NOT NULL,
    "companyOrgId" UUID NOT NULL,
    "sharesOffered" DECIMAL(24,6) NOT NULL,
    "askPricePerShare" DECIMAL(20,8) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "SecondaryListingStatus" NOT NULL DEFAULT 'DRAFT',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecondaryListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecondaryOrder" (
    "id" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "buyerOrgId" UUID NOT NULL,
    "side" "SecondaryOrderSide" NOT NULL,
    "shares" DECIMAL(24,6) NOT NULL,
    "pricePerShare" DECIMAL(20,8) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "SecondaryOrderStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecondaryOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_orgId_key" ON "Company"("orgId");

-- CreateIndex
CREATE INDEX "Company_stage_idx" ON "Company"("stage");

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_companyId_key" ON "CompanyProfile"("companyId");

-- CreateIndex
CREATE INDEX "Founder_companyId_idx" ON "Founder"("companyId");

-- CreateIndex
CREATE INDEX "Opportunity_status_idx" ON "Opportunity"("status");

-- CreateIndex
CREATE INDEX "Opportunity_round_idx" ON "Opportunity"("round");

-- CreateIndex
CREATE INDEX "Opportunity_companyOrgId_idx" ON "Opportunity"("companyOrgId");

-- CreateIndex
CREATE INDEX "Match_investorOrgId_idx" ON "Match"("investorOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_opportunityId_investorOrgId_key" ON "Match"("opportunityId", "investorOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_investorOrgId_opportunityId_key" ON "Watchlist"("investorOrgId", "opportunityId");

-- CreateIndex
CREATE INDEX "Deal_companyOrgId_idx" ON "Deal"("companyOrgId");

-- CreateIndex
CREATE INDEX "Deal_investorOrgId_idx" ON "Deal"("investorOrgId");

-- CreateIndex
CREATE INDEX "Deal_status_idx" ON "Deal"("status");

-- CreateIndex
CREATE INDEX "DealMember_dealId_idx" ON "DealMember"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "DealMember_dealId_userId_key" ON "DealMember"("dealId", "userId");

-- CreateIndex
CREATE INDEX "DealMessage_dealId_idx" ON "DealMessage"("dealId");

-- CreateIndex
CREATE INDEX "NdaAgreement_dealId_idx" ON "NdaAgreement"("dealId");

-- CreateIndex
CREATE INDEX "Document_orgId_idx" ON "Document"("orgId");

-- CreateIndex
CREATE INDEX "Document_dealId_idx" ON "Document"("dealId");

-- CreateIndex
CREATE INDEX "Document_companyId_idx" ON "Document"("companyId");

-- CreateIndex
CREATE INDEX "DocumentAccessGrant_documentId_idx" ON "DocumentAccessGrant"("documentId");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_documentId_idx" ON "DocumentAccessLog"("documentId");

-- CreateIndex
CREATE INDEX "DueDiligenceItem_dealId_idx" ON "DueDiligenceItem"("dealId");

-- CreateIndex
CREATE INDEX "DocumentRequest_dealId_idx" ON "DocumentRequest"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MfaCredential_userId_method_key" ON "MfaCredential"("userId", "method");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_familyId_idx" ON "Session"("familyId");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_orgId_userId_key" ON "Membership"("orgId", "userId");

-- CreateIndex
CREATE INDEX "TermSheet_dealId_idx" ON "TermSheet"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "TermSheetVersion_termSheetId_version_key" ON "TermSheetVersion"("termSheetId", "version");

-- CreateIndex
CREATE INDEX "SignatureEnvelope_dealId_idx" ON "SignatureEnvelope"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "SignatureParty_envelopeId_userId_key" ON "SignatureParty"("envelopeId", "userId");

-- CreateIndex
CREATE INDEX "Investment_investorOrgId_idx" ON "Investment"("investorOrgId");

-- CreateIndex
CREATE INDEX "Investment_companyOrgId_idx" ON "Investment"("companyOrgId");

-- CreateIndex
CREATE INDEX "Investment_status_idx" ON "Investment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Position_investmentId_key" ON "Position"("investmentId");

-- CreateIndex
CREATE INDEX "Position_investorOrgId_idx" ON "Position"("investorOrgId");

-- CreateIndex
CREATE INDEX "Position_companyOrgId_idx" ON "Position"("companyOrgId");

-- CreateIndex
CREATE INDEX "CapTableEntry_companyId_idx" ON "CapTableEntry"("companyId");

-- CreateIndex
CREATE INDEX "CapTableEvent_companyId_idx" ON "CapTableEvent"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorProfile_orgId_key" ON "InvestorProfile"("orgId");

-- CreateIndex
CREATE INDEX "InvestorProfile_type_idx" ON "InvestorProfile"("type");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentPreference_investorProfileId_key" ON "InvestmentPreference"("investorProfileId");

-- CreateIndex
CREATE INDEX "Accreditation_investorProfileId_idx" ON "Accreditation"("investorProfileId");

-- CreateIndex
CREATE INDEX "Accreditation_status_idx" ON "Accreditation"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_idx" ON "AuditLog"("orgId");

-- CreateIndex
CREATE INDEX "AuditLog_subjectType_subjectId_idx" ON "AuditLog"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "EscrowAccount_dealId_idx" ON "EscrowAccount"("dealId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_escrowAccountId_idx" ON "EscrowTransaction"("escrowAccountId");

-- CreateIndex
CREATE INDEX "PaymentMethod_orgId_idx" ON "PaymentMethod"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_orgId_idx" ON "Payment"("orgId");

-- CreateIndex
CREATE INDEX "Payment_investmentId_idx" ON "Payment"("investmentId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Distribution_investorOrgId_idx" ON "Distribution"("investorOrgId");

-- CreateIndex
CREATE INDEX "Distribution_companyOrgId_idx" ON "Distribution"("companyOrgId");

-- CreateIndex
CREATE INDEX "Distribution_status_idx" ON "Distribution"("status");

-- CreateIndex
CREATE INDEX "LedgerEntry_account_idx" ON "LedgerEntry"("account");

-- CreateIndex
CREATE INDEX "LedgerEntry_refType_refId_idx" ON "LedgerEntry"("refType", "refId");

-- CreateIndex
CREATE INDEX "Valuation_companyOrgId_idx" ON "Valuation"("companyOrgId");

-- CreateIndex
CREATE INDEX "Valuation_investmentId_idx" ON "Valuation"("investmentId");

-- CreateIndex
CREATE INDEX "ReturnSnapshot_investorOrgId_idx" ON "ReturnSnapshot"("investorOrgId");

-- CreateIndex
CREATE INDEX "ReturnSnapshot_investmentId_idx" ON "ReturnSnapshot"("investmentId");

-- CreateIndex
CREATE INDEX "TaxDocument_investorOrgId_taxYear_idx" ON "TaxDocument"("investorOrgId", "taxYear");

-- CreateIndex
CREATE INDEX "SecondaryListing_status_idx" ON "SecondaryListing"("status");

-- CreateIndex
CREATE INDEX "SecondaryListing_companyOrgId_idx" ON "SecondaryListing"("companyOrgId");

-- CreateIndex
CREATE INDEX "SecondaryOrder_listingId_idx" ON "SecondaryOrder"("listingId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Founder" ADD CONSTRAINT "Founder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealMember" ADD CONSTRAINT "DealMember_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealMessage" ADD CONSTRAINT "DealMessage_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdaAgreement" ADD CONSTRAINT "NdaAgreement_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessGrant" ADD CONSTRAINT "DocumentAccessGrant_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDiligenceItem" ADD CONSTRAINT "DueDiligenceItem_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaCredential" ADD CONSTRAINT "MfaCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermSheet" ADD CONSTRAINT "TermSheet_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermSheetVersion" ADD CONSTRAINT "TermSheetVersion_termSheetId_fkey" FOREIGN KEY ("termSheetId") REFERENCES "TermSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureParty" ADD CONSTRAINT "SignatureParty_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "SignatureEnvelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorProfile" ADD CONSTRAINT "InvestorProfile_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentPreference" ADD CONSTRAINT "InvestmentPreference_investorProfileId_fkey" FOREIGN KEY ("investorProfileId") REFERENCES "InvestorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accreditation" ADD CONSTRAINT "Accreditation_investorProfileId_fkey" FOREIGN KEY ("investorProfileId") REFERENCES "InvestorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowAccount" ADD CONSTRAINT "EscrowAccount_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowTransaction" ADD CONSTRAINT "EscrowTransaction_escrowAccountId_fkey" FOREIGN KEY ("escrowAccountId") REFERENCES "EscrowAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryOrder" ADD CONSTRAINT "SecondaryOrder_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SecondaryListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
