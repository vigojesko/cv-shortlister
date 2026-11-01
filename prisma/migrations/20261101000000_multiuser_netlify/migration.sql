-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "googleSubject" TEXT,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "ownerId" TEXT NOT NULL DEFAULT '__legacy__',
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "mustHaveRequirements" TEXT NOT NULL,
    "niceToHaveRequirements" TEXT NOT NULL,
    "minExperienceYears" INTEGER NOT NULL DEFAULT 0,
    "minEducation" TEXT NOT NULL DEFAULT 'SMA/SMK',
    "emailKeywords" TEXT NOT NULL,
    "emailLabels" TEXT,
    "weightSkills" INTEGER NOT NULL DEFAULT 35,
    "weightExperience" INTEGER NOT NULL DEFAULT 30,
    "weightEducation" INTEGER NOT NULL DEFAULT 15,
    "weightPortfolio" INTEGER NOT NULL DEFAULT 20,
    "shortlistRuleType" TEXT NOT NULL DEFAULT 'THRESHOLD',
    "shortlistThreshold" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    "shortlistTopN" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "ownerId" TEXT NOT NULL DEFAULT '__legacy__',
    "id" TEXT NOT NULL,
    "positionId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "totalExperienceYears" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "educationList" TEXT NOT NULL,
    "links" TEXT NOT NULL,
    "scoreSkills" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scoreExperience" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scoreEducation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scorePortfolio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mustHaveResults" TEXT NOT NULL,
    "niceToHaveResults" TEXT NOT NULL,
    "allMustHaveMet" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT NOT NULL,
    "portfolioSummary" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "gaps" TEXT NOT NULL,
    "strongestAspect" TEXT NOT NULL,
    "aiRecommendation" TEXT NOT NULL,
    "aiReasoning" TEXT NOT NULL,
    "aiConfidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "status" TEXT NOT NULL DEFAULT 'MAYBE',
    "isManualOverride" BOOLEAN NOT NULL DEFAULT false,
    "hrNotes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'GMAIL',
    "gmailMessageId" TEXT,
    "emailSubject" TEXT,
    "emailSender" TEXT,
    "emailDate" TIMESTAMP(3),
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "filePath" TEXT,
    "fileMimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GmailAccount" (
    "nextPageToken" TEXT,
    "scanAfter" TIMESTAMP(3),
    "lastResult" TEXT,
    "ownerId" TEXT NOT NULL DEFAULT '__legacy__',
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,
    "syncIntervalMinutes" INTEGER NOT NULL DEFAULT 15,
    "backfillDays" INTEGER NOT NULL DEFAULT 14,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GmailAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobQueue" (
    "ownerId" TEXT NOT NULL DEFAULT '__legacy__',
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "positionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedEmail" (
    "ownerId" TEXT NOT NULL DEFAULT '__legacy__',
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "subject" TEXT,
    "sender" TEXT,
    "date" TIMESTAMP(3),
    "actionTaken" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL DEFAULT '__legacy__',
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerLease" (
    "ownerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerLease_pkey" PRIMARY KEY ("ownerId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");

-- CreateIndex
CREATE INDEX "Position_ownerId_idx" ON "Position"("ownerId");

-- CreateIndex
CREATE INDEX "Candidate_ownerId_idx" ON "Candidate"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_ownerId_gmailMessageId_key" ON "Candidate"("ownerId", "gmailMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_ownerId_fileHash_key" ON "Candidate"("ownerId", "fileHash");

-- CreateIndex
CREATE UNIQUE INDEX "GmailAccount_email_key" ON "GmailAccount"("email");

-- CreateIndex
CREATE INDEX "GmailAccount_ownerId_idx" ON "GmailAccount"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "GmailAccount_ownerId_key" ON "GmailAccount"("ownerId");

-- CreateIndex
CREATE INDEX "JobQueue_ownerId_idx" ON "JobQueue"("ownerId");

-- CreateIndex
CREATE INDEX "ProcessedEmail_ownerId_idx" ON "ProcessedEmail"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedEmail_ownerId_messageId_key" ON "ProcessedEmail"("ownerId", "messageId");

-- CreateIndex
CREATE INDEX "StoredFile_ownerId_idx" ON "StoredFile"("ownerId");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobQueue" ADD CONSTRAINT "JobQueue_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

