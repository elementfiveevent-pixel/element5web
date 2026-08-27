export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ORG_ADMIN = "ORG_ADMIN",
  ARTIST = "ARTIST",
  AUDIENCE = "AUDIENCE",
  VOLUNTEER = "VOLUNTEER"
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING_VERIFICATION = "PENDING_VERIFICATION"
}

export enum AvailabilityStatus {
  AVAILABLE = "AVAILABLE",
  UNAVAILABLE = "UNAVAILABLE",
  BOOKED = "BOOKED",
  ON_TOUR = "ON_TOUR"
}

export enum EventCategory {
  STAGEVERSE = "STAGEVERSE",
  FESTIVAL = "FESTIVAL",
  WORKSHOP = "WORKSHOP",
  MEETUP = "MEETUP",
  NETWORKING = "NETWORKING",
  AWARDS = "AWARDS",
  PRIVATE = "PRIVATE",
  EXHIBITION = "EXHIBITION",
  COMMUNITY = "COMMUNITY"
}

export enum EventStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED"
}

export enum PaymentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  REFUNDED = "REFUNDED"
}

export enum SubmissionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export enum ReportStatus {
  OPEN = "OPEN",
  UNDER_REVIEW = "UNDER_REVIEW",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED"
}

export namespace Prisma {
  export type InputJsonValue = any;
  export type JsonValue = any;
}
