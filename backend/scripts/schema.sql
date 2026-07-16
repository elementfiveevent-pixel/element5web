-- 1. Enums (Idempotent creation checks)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'ARTIST', 'AUDIENCE', 'VOLUNTEER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
    CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AvailabilityStatus') THEN
    CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'BOOKED', 'ON_TOUR');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventCategory') THEN
    CREATE TYPE "EventCategory" AS ENUM ('STAGEVERSE', 'FESTIVAL', 'WORKSHOP', 'MEETUP', 'NETWORKING', 'AWARDS', 'PRIVATE', 'EXHIBITION', 'COMMUNITY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventStatus') THEN
    CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED', 'ARCHIVED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubmissionStatus') THEN
    CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReportStatus') THEN
    CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');
  END IF;
END $$;

-- 2. Core Tables
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT,
  "fullName" TEXT NOT NULL,
  "mobileNumber" TEXT,
  "profilePhotoUrl" TEXT,
  "status" "UserStatus" DEFAULT 'ACTIVE',
  "reputationXp" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "RoleAssignment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "role" "UserRole" NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoleAssignment_userId_role_key" UNIQUE ("userId", "role")
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "deviceFingerprint" TEXT,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS "RefreshToken" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "token" TEXT UNIQUE NOT NULL,
  "isUsed" BOOLEAN DEFAULT FALSE,
  "isRevoked" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS "ArtistProfile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "stageName" TEXT UNIQUE NOT NULL,
  "biography" TEXT,
  "portfolioUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isVerified" BOOLEAN DEFAULT FALSE,
  "availabilityStatus" "AvailabilityStatus" DEFAULT 'AVAILABLE',
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "city" TEXT,
  "state" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Event" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizerId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "flyerUrl" TEXT,
  "category" "EventCategory" NOT NULL,
  "status" "EventStatus" DEFAULT 'DRAFT',
  "maxCapacity" INTEGER,
  "registrationsCount" INTEGER DEFAULT 0,
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE,
  "registrationEndDate" TIMESTAMP WITH TIME ZONE,
  "isPaid" BOOLEAN DEFAULT FALSE,
  "price" DECIMAL(10, 2) DEFAULT 0.00,
  "audiencePrice" DECIMAL(10, 2) DEFAULT 0.00,
  "artistPrice" DECIMAL(10, 2) DEFAULT 0.00,
  "upiQrUrl" TEXT,
  "upiVpa" TEXT,
  "termsConditions" TEXT,
  "customFields" JSONB DEFAULT '[]'::jsonb,
  "viewsCount" INTEGER DEFAULT 0,
  "slug" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Location" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId" UUID UNIQUE NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "venueName" TEXT NOT NULL,
  "venueAddress" TEXT NOT NULL,
  "mapsLink" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "TicketCategory" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId" UUID NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "price" DECIMAL(10, 2) NOT NULL,
  "maxCapacity" INTEGER,
  "soldCount" INTEGER DEFAULT 0,
  "description" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EventRegistration" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId" UUID NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "customData" JSONB DEFAULT '{}'::jsonb,
  "paymentScreenshotUrl" TEXT,
  "paymentStatus" "PaymentStatus" DEFAULT 'PENDING',
  "reviewedAt" TIMESTAMP WITH TIME ZONE,
  "teamId" TEXT,
  "isGroupBooking" BOOLEAN DEFAULT FALSE,
  "groupSize" INTEGER DEFAULT 1,
  "baseAmount" DECIMAL(10, 2) NOT NULL,
  "addonsAmount" DECIMAL(10, 2) DEFAULT 0.00,
  "totalAmount" DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventRegistration_eventId_userId_key" UNIQUE ("eventId", "userId")
);

CREATE TABLE IF NOT EXISTS "EventTicket" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "registrationId" UUID NOT NULL REFERENCES "EventRegistration"("id") ON DELETE CASCADE,
  "eventId" UUID NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "qrCode" TEXT UNIQUE NOT NULL,
  "isUsed" BOOLEAN DEFAULT FALSE,
  "usedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "StageVerseSubmission" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId" UUID NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "trackTitle" TEXT NOT NULL,
  "audioVideoUrl" TEXT NOT NULL,
  "performanceOrder" INTEGER,
  "status" "SubmissionStatus" DEFAULT 'PENDING',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StageVerseSubmission_eventId_userId_key" UNIQUE ("eventId", "userId")
);

CREATE TABLE IF NOT EXISTS "Vote" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "submissionId" UUID NOT NULL REFERENCES "StageVerseSubmission"("id") ON DELETE CASCADE,
  "voterId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "weight" INTEGER DEFAULT 1,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Vote_submissionId_voterId_key" UNIQUE ("submissionId", "voterId")
);

CREATE TABLE IF NOT EXISTS "JudgeScore" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "submissionId" UUID NOT NULL REFERENCES "StageVerseSubmission"("id") ON DELETE CASCADE,
  "judgeId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "originalityScore" INTEGER NOT NULL,
  "technicalityScore" INTEGER NOT NULL,
  "engagementScore" INTEGER NOT NULL,
  "feedback" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JudgeScore_submissionId_judgeId_key" UNIQUE ("submissionId", "judgeId")
);

CREATE TABLE IF NOT EXISTS "Follow" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "followerId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "followingId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Follow_followerId_followingId_key" UNIQUE ("followerId", "followingId")
);

CREATE TABLE IF NOT EXISTS "Community" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "CommunityMember" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "communityId" UUID NOT NULL REFERENCES "Community"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityMember_communityId_userId_key" UNIQUE ("communityId", "userId")
);

CREATE TABLE IF NOT EXISTS "Post" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "communityId" UUID REFERENCES "Community"("id") ON DELETE SET NULL,
  "authorId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "mediaUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Like" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "postId" UUID NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Like_postId_userId_key" UNIQUE ("postId", "userId")
);

CREATE TABLE IF NOT EXISTS "Comment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "postId" UUID NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
  "authorId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Message" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "senderId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "recipientId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ModerationReport" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "reporterId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "ReportStatus" DEFAULT 'OPEN',
  "moderatorId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "actionTaken" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "CheckInAuditLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticketId" UUID REFERENCES "EventTicket"("id") ON DELETE SET NULL,
  "eventId" UUID NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "deviceFingerprint" TEXT,
  "verificationMethod" TEXT DEFAULT 'QR_SCAN',
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "LeaderboardStanding" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "timeframe" TEXT NOT NULL,
  "artistProfileId" UUID NOT NULL REFERENCES "ArtistProfile"("id") ON DELETE CASCADE,
  "totalScore" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "ArtistProfile_isVerified_idx" ON "ArtistProfile"("isVerified");
CREATE INDEX IF NOT EXISTS "Event_status_category_idx" ON "Event"("status", "category");
CREATE INDEX IF NOT EXISTS "Event_startDate_idx" ON "Event"("startDate");

-- 2026 Schema Updates
ALTER TABLE "TicketCategory" ADD COLUMN IF NOT EXISTS "artistQrUrl" TEXT;
ALTER TABLE "TicketCategory" ADD COLUMN IF NOT EXISTS "audienceQrUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "upiId" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "artistQrUrl" TEXT;

-- 2026 Dynamic Feed updates
CREATE TABLE IF NOT EXISTS "Highlight" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "imageUrl" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

