"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventController = void 0;
const common_1 = require("@nestjs/common");
const event_service_1 = require("./event.service");
const create_event_dto_1 = require("./dto/create-event.dto");
const register_event_dto_1 = require("./dto/register-event.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("../../prisma-stub.ts");
const swagger_1 = require("@nestjs/swagger");
let EventController = class EventController {
    eventService;
    constructor(eventService) {
        this.eventService = eventService;
    }
    async list(search, category, city, period, limit, offset) {
        return this.eventService.listEvents({ search, category, city, period, limit, offset });
    }
    async get(idOrSlug) {
        return this.eventService.getEvent(idOrSlug);
    }
    async create(user, dto) {
        return this.eventService.createEvent(user.id, dto);
    }
    async register(user, eventId, dto) {
        return this.eventService.register(user.id, eventId, dto);
    }
    async checkIn(qrCode, fingerprint, ip, ua) {
        return this.eventService.checkInTicket(qrCode, ip, ua, fingerprint);
    }
    async checkOut(qrCode, fingerprint, ip, ua) {
        return this.eventService.checkOutTicket(qrCode, ip, ua, fingerprint);
    }
    async myTickets(user) {
        return this.eventService.getMyTickets(user.id);
    }
    async myEvents(user) {
        return this.eventService.getOrganizerEvents(user.id, user.roles ?? []);
    }
    async registrations(user, eventId) {
        return this.eventService.getEventRegistrations(eventId, user.id, user.roles ?? []);
    }
    async analytics(user, eventId) {
        return this.eventService.getEventAnalytics(eventId, user.id, user.roles ?? []);
    }
    async update(user, eventId, dto) {
        return this.eventService.updateEvent(eventId, user.id, dto, user.roles ?? []);
    }
    async reviewRegistration(user, registrationId, action) {
        return this.eventService.reviewRegistration(registrationId, user.id, action, user.roles ?? []);
    }
};
exports.EventController = EventController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List and filter upcoming published events" }),
    __param(0, (0, common_1.Query)("search")),
    __param(1, (0, common_1.Query)("category")),
    __param(2, (0, common_1.Query)("city")),
    __param(3, (0, common_1.Query)("period")),
    __param(4, (0, common_1.Query)("limit")),
    __param(5, (0, common_1.Query)("offset")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":idOrSlug"),
    (0, swagger_1.ApiOperation)({ summary: "Get event metadata by ID or Slug" }),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ORG_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a new event" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_event_dto_1.CreateEventDto]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(":eventId/register"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Register for tickets atomically" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("eventId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, register_event_dto_1.RegisterEventDto]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "register", null);
__decorate([
    (0, common_1.Post)("tickets/checkin"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ORG_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Scan and check-in ticket QR codes at venues" }),
    __param(0, (0, common_1.Body)("qrCode")),
    __param(1, (0, common_1.Body)("deviceFingerprint")),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Headers)("user-agent")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Post)("tickets/checkout"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ORG_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Scan and check-out ticket QR codes at venues" }),
    __param(0, (0, common_1.Body)("qrCode")),
    __param(1, (0, common_1.Body)("deviceFingerprint")),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Headers)("user-agent")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "checkOut", null);
__decorate([
    (0, common_1.Get)("attendee/my-tickets"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all tickets for the authenticated user" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "myTickets", null);
__decorate([
    (0, common_1.Get)("organizer/my-events"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ORG_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get organizer's own events" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "myEvents", null);
__decorate([
    (0, common_1.Get)(":eventId/registrations"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ORG_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all registrations for an event (organizer only)" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("eventId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "registrations", null);
__decorate([
    (0, common_1.Get)(":eventId/analytics"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ORG_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get event analytics for organizer" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("eventId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "analytics", null);
__decorate([
    (0, common_1.Put)(":eventId"),
    (0, common_1.Patch)(":eventId"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ORG_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Update an existing event" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("eventId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)("registrations/:registrationId/review"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ORG_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Approve or reject a registration (payment review)" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("registrationId")),
    __param(2, (0, common_1.Body)("action")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "reviewRegistration", null);
exports.EventController = EventController = __decorate([
    (0, swagger_1.ApiTags)("Events Platform"),
    (0, common_1.Controller)("events"),
    __metadata("design:paramtypes", [event_service_1.EventService])
], EventController);
//# sourceMappingURL=event.controller.js.map