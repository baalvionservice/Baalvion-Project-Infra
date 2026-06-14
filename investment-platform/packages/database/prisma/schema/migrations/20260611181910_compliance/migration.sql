-- CreateTable
CREATE TABLE "KycCheck" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "subjectType" "SubjectType" NOT NULL,
    "subjectUserId" UUID,
    "provider" TEXT NOT NULL DEFAULT 'sumsub',
    "applicantId" TEXT,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "levelName" TEXT,
    "reviewResult" TEXT,
    "riskCountry" BOOLEAN NOT NULL DEFAULT false,
    "sanctionsHit" BOOLEAN NOT NULL DEFAULT false,
    "pepHit" BOOLEAN NOT NULL DEFAULT false,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmlScreening" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "subjectUserId" UUID,
    "provider" TEXT NOT NULL DEFAULT 'sumsub',
    "status" "AmlStatus" NOT NULL DEFAULT 'PENDING',
    "riskScore" INTEGER,
    "matchesJson" JSONB,
    "screenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmlScreening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCase" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "type" "ComplianceCaseType" NOT NULL,
    "status" "ComplianceCaseStatus" NOT NULL DEFAULT 'OPEN',
    "summary" TEXT,
    "assigneeId" UUID,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ComplianceCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KycCheck_orgId_idx" ON "KycCheck"("orgId");

-- CreateIndex
CREATE INDEX "KycCheck_applicantId_idx" ON "KycCheck"("applicantId");

-- CreateIndex
CREATE INDEX "KycCheck_status_idx" ON "KycCheck"("status");

-- CreateIndex
CREATE INDEX "AmlScreening_orgId_idx" ON "AmlScreening"("orgId");

-- CreateIndex
CREATE INDEX "AmlScreening_status_idx" ON "AmlScreening"("status");

-- CreateIndex
CREATE INDEX "ComplianceCase_orgId_idx" ON "ComplianceCase"("orgId");

-- CreateIndex
CREATE INDEX "ComplianceCase_status_idx" ON "ComplianceCase"("status");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_idx" ON "ConsentRecord"("userId");
