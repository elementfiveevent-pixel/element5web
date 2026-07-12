export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ORG_ADMIN = "ORG_ADMIN",
    ARTIST = "ARTIST",
    AUDIENCE = "AUDIENCE",
    VOLUNTEER = "VOLUNTEER"
}
export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
}
export declare enum AvailabilityStatus {
    AVAILABLE = "AVAILABLE",
    UNAVAILABLE = "UNAVAILABLE",
    BOOKED = "BOOKED",
    ON_TOUR = "ON_TOUR"
}
export declare enum EventCategory {
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
export declare enum EventStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    CANCELLED = "CANCELLED",
    COMPLETED = "COMPLETED",
    ARCHIVED = "ARCHIVED"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    REFUNDED = "REFUNDED"
}
export declare enum SubmissionStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare enum ReportStatus {
    OPEN = "OPEN",
    UNDER_REVIEW = "UNDER_REVIEW",
    RESOLVED = "RESOLVED",
    DISMISSED = "DISMISSED"
}
export declare namespace Prisma {
    type InputJsonValue = any;
    type EventWhereInput = any;
    class PrismaClientKnownRequestError extends Error {
        code: string;
        meta?: any;
        constructor(message: string, code: string, meta?: any);
    }
}
export declare class PrismaClient {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
}
