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
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let EventController = class EventController {
    eventService;
    constructor(eventService) {
        this.eventService = eventService;
    }
    async list(search, category, city, limit, offset) {
        return this.eventService.listEvents({ search, category, city, limit, offset });
    }
    async create(user, dto) {
        return this.eventService.createEvent(user.id, dto);
    }
    async get(idOrSlug) {
        return this.eventService.getEvent(idOrSlug);
    }
    async register(user, eventId, dto) {
        return this.eventService.register(user.id, eventId, dto);
    }
    async checkIn(qrCode, fingerprint, ip, ua) {
        return this.eventService.checkInTicket(qrCode, ip, ua, fingerprint);
    }
};
exports.EventController = EventController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List and filter upcoming published events" }),
    __param(0, (0, common_1.Query)("search")),
    __param(1, (0, common_1.Query)("category")),
    __param(2, (0, common_1.Query)("city")),
    __param(3, (0, common_1.Query)("limit")),
    __param(4, (0, common_1.Query)("offset")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.EVENT_MANAGER),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a new event" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_event_dto_1.CreateEventDto]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(":idOrSlug"),
    (0, swagger_1.ApiOperation)({ summary: "Get event metadata by ID or Slug" }),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "get", null);
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
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ORG_ADMIN, client_1.UserRole.EVENT_MANAGER, client_1.UserRole.MODERATOR),
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
exports.EventController = EventController = __decorate([
    (0, swagger_1.ApiTags)("Events Platform"),
    (0, common_1.Controller)("events"),
    __metadata("design:paramtypes", [event_service_1.EventService])
], EventController);
//# sourceMappingURL=event.controller.js.map