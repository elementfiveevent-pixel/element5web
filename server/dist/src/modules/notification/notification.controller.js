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
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let NotificationController = class NotificationController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getNotifications(user) {
        return this.prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });
    }
    async markAsRead(user, id) {
        return this.prisma.notification.update({
            where: { id, userId: user.id },
            data: { isRead: true },
        });
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get in-app notifications for authenticated user" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Put)(":id/read"),
    (0, swagger_1.ApiOperation)({ summary: "Mark a specific notification as read" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAsRead", null);
exports.NotificationController = NotificationController = __decorate([
    (0, swagger_1.ApiTags)("User Alerts & Notifications"),
    (0, common_1.Controller)("notifications"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationController);
//# sourceMappingURL=notification.controller.js.map