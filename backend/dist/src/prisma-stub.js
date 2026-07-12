"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClient = exports.Prisma = exports.ReportStatus = exports.SubmissionStatus = exports.PaymentStatus = exports.EventStatus = exports.EventCategory = exports.AvailabilityStatus = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ORG_ADMIN"] = "ORG_ADMIN";
    UserRole["ARTIST"] = "ARTIST";
    UserRole["AUDIENCE"] = "AUDIENCE";
    UserRole["VOLUNTEER"] = "VOLUNTEER";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["PENDING_VERIFICATION"] = "PENDING_VERIFICATION";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var AvailabilityStatus;
(function (AvailabilityStatus) {
    AvailabilityStatus["AVAILABLE"] = "AVAILABLE";
    AvailabilityStatus["UNAVAILABLE"] = "UNAVAILABLE";
    AvailabilityStatus["BOOKED"] = "BOOKED";
    AvailabilityStatus["ON_TOUR"] = "ON_TOUR";
})(AvailabilityStatus || (exports.AvailabilityStatus = AvailabilityStatus = {}));
var EventCategory;
(function (EventCategory) {
    EventCategory["STAGEVERSE"] = "STAGEVERSE";
    EventCategory["FESTIVAL"] = "FESTIVAL";
    EventCategory["WORKSHOP"] = "WORKSHOP";
    EventCategory["MEETUP"] = "MEETUP";
    EventCategory["NETWORKING"] = "NETWORKING";
    EventCategory["AWARDS"] = "AWARDS";
    EventCategory["PRIVATE"] = "PRIVATE";
    EventCategory["EXHIBITION"] = "EXHIBITION";
    EventCategory["COMMUNITY"] = "COMMUNITY";
})(EventCategory || (exports.EventCategory = EventCategory = {}));
var EventStatus;
(function (EventStatus) {
    EventStatus["DRAFT"] = "DRAFT";
    EventStatus["PUBLISHED"] = "PUBLISHED";
    EventStatus["CANCELLED"] = "CANCELLED";
    EventStatus["COMPLETED"] = "COMPLETED";
    EventStatus["ARCHIVED"] = "ARCHIVED";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["APPROVED"] = "APPROVED";
    PaymentStatus["REJECTED"] = "REJECTED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var SubmissionStatus;
(function (SubmissionStatus) {
    SubmissionStatus["PENDING"] = "PENDING";
    SubmissionStatus["APPROVED"] = "APPROVED";
    SubmissionStatus["REJECTED"] = "REJECTED";
})(SubmissionStatus || (exports.SubmissionStatus = SubmissionStatus = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["OPEN"] = "OPEN";
    ReportStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    ReportStatus["RESOLVED"] = "RESOLVED";
    ReportStatus["DISMISSED"] = "DISMISSED";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var Prisma;
(function (Prisma) {
    class PrismaClientKnownRequestError extends Error {
        code;
        meta;
        constructor(message, code, meta) {
            super(message);
            this.code = code;
            this.meta = meta;
        }
    }
    Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
})(Prisma || (exports.Prisma = Prisma = {}));
class PrismaClient {
    async $connect() { }
    async $disconnect() { }
}
exports.PrismaClient = PrismaClient;
//# sourceMappingURL=prisma-stub.js.map