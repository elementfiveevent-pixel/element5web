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
exports.StageVerseController = void 0;
const common_1 = require("@nestjs/common");
const stageverse_service_1 = require("./stageverse.service");
const submit_track_dto_1 = require("./dto/submit-track.dto");
const submit_score_dto_1 = require("./dto/submit-score.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let StageVerseController = class StageVerseController {
    stageVerseService;
    constructor(stageVerseService) {
        this.stageVerseService = stageVerseService;
    }
    async submit(user, dto) {
        return this.stageVerseService.submitTrack(user.id, dto);
    }
    async getSubmissions(eventId) {
        return this.stageVerseService.listSubmissions(eventId);
    }
    async score(user, subId, dto) {
        return this.stageVerseService.submitJudgeScore(user.id, subId, dto);
    }
    async vote(user, subId) {
        return this.stageVerseService.castVote(user.id, subId);
    }
    async toggleVoting(eventId, open) {
        return this.stageVerseService.toggleVoting(eventId, open);
    }
    async getVotingStatus(eventId) {
        return this.stageVerseService.getVotingStatus(eventId);
    }
    async resetVotes(eventId) {
        return this.stageVerseService.resetVotes(eventId);
    }
    async getStandings(eventId) {
        return this.stageVerseService.calculateStandings(eventId);
    }
};
exports.StageVerseController = StageVerseController;
__decorate([
    (0, common_1.Post)("submit"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ARTIST),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Artists submit performance track for StageVerse contest" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, submit_track_dto_1.SubmitTrackDto]),
    __metadata("design:returntype", Promise)
], StageVerseController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)(":eventId/submissions"),
    (0, swagger_1.ApiOperation)({ summary: "Get approved submissions for an event" }),
    __param(0, (0, common_1.Param)("eventId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StageVerseController.prototype, "getSubmissions", null);
__decorate([
    (0, common_1.Post)("submissions/:submissionId/score"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ORG_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Authorized judges submit score metrics" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("submissionId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, submit_score_dto_1.SubmitScoreDto]),
    __metadata("design:returntype", Promise)
], StageVerseController.prototype, "score", null);
__decorate([
    (0, common_1.Post)("submissions/:submissionId/vote"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Audience cast vote for active performance slot" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("submissionId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StageVerseController.prototype, "vote", null);
__decorate([
    (0, common_1.Post)(":eventId/voting/toggle"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ORG_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Organizers toggle live voting status for an event" }),
    __param(0, (0, common_1.Param)("eventId")),
    __param(1, (0, common_1.Body)("open")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], StageVerseController.prototype, "toggleVoting", null);
__decorate([
    (0, common_1.Get)(":eventId/voting/status"),
    (0, swagger_1.ApiOperation)({ summary: "Get voting status (open/closed) for an event" }),
    __param(0, (0, common_1.Param)("eventId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StageVerseController.prototype, "getVotingStatus", null);
__decorate([
    (0, common_1.Post)(":eventId/voting/reset"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ORG_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Organizers reset all votes for an event" }),
    __param(0, (0, common_1.Param)("eventId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StageVerseController.prototype, "resetVotes", null);
__decorate([
    (0, common_1.Get)(":eventId/standings"),
    (0, swagger_1.ApiOperation)({ summary: "Get current score standings for an event" }),
    __param(0, (0, common_1.Param)("eventId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StageVerseController.prototype, "getStandings", null);
exports.StageVerseController = StageVerseController = __decorate([
    (0, swagger_1.ApiTags)("StageVerse Live Arena"),
    (0, common_1.Controller)("stageverse"),
    __metadata("design:paramtypes", [stageverse_service_1.StageVerseService])
], StageVerseController);
//# sourceMappingURL=stageverse.controller.js.map