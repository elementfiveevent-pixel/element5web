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
exports.SocialController = void 0;
const common_1 = require("@nestjs/common");
const social_service_1 = require("./social.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let SocialController = class SocialController {
    socialService;
    constructor(socialService) {
        this.socialService = socialService;
    }
    async follow(user, followingId) {
        return this.socialService.follow(user.id, followingId);
    }
    async unfollow(user, followingId) {
        return this.socialService.unfollow(user.id, followingId);
    }
    async createCommunity(user, name, description) {
        return this.socialService.createCommunity(user.id, name, description);
    }
    async joinCommunity(user, communityId) {
        return this.socialService.joinCommunity(user.id, communityId);
    }
    async createPost(user, communityId, title, content) {
        return this.socialService.createPost(user.id, communityId, title, content);
    }
    async likePost(user, postId) {
        return this.socialService.likePost(user.id, postId);
    }
    async addComment(user, postId, content) {
        return this.socialService.addComment(user.id, postId, content);
    }
    async sendMessage(user, recipientId, content) {
        return this.socialService.sendMessage(user.id, recipientId, content);
    }
    async getMessages(user, contactId) {
        return this.socialService.getMessages(user.id, contactId);
    }
};
exports.SocialController = SocialController;
__decorate([
    (0, common_1.Post)("follow/:userId"),
    (0, swagger_1.ApiOperation)({ summary: "Follow a creator or peer" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "follow", null);
__decorate([
    (0, common_1.Delete)("follow/:userId"),
    (0, swagger_1.ApiOperation)({ summary: "Unfollow a creator or peer" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "unfollow", null);
__decorate([
    (0, common_1.Post)("communities"),
    (0, swagger_1.ApiOperation)({ summary: "Create a new guild or community hub" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)("name")),
    __param(2, (0, common_1.Body)("description")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "createCommunity", null);
__decorate([
    (0, common_1.Post)("communities/:communityId/join"),
    (0, swagger_1.ApiOperation)({ summary: "Join an active community" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("communityId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "joinCommunity", null);
__decorate([
    (0, common_1.Post)("communities/:communityId/posts"),
    (0, swagger_1.ApiOperation)({ summary: "Write a post in a community hub" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("communityId")),
    __param(2, (0, common_1.Body)("title")),
    __param(3, (0, common_1.Body)("content")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "createPost", null);
__decorate([
    (0, common_1.Post)("posts/:postId/like"),
    (0, swagger_1.ApiOperation)({ summary: "Toggle like status on a post" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("postId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "likePost", null);
__decorate([
    (0, common_1.Post)("posts/:postId/comments"),
    (0, swagger_1.ApiOperation)({ summary: "Comment on a discussion post" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("postId")),
    __param(2, (0, common_1.Body)("content")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "addComment", null);
__decorate([
    (0, common_1.Post)("messages"),
    (0, swagger_1.ApiOperation)({ summary: "Send a direct private message" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)("recipientId")),
    __param(2, (0, common_1.Body)("content")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)("messages/:contactId"),
    (0, swagger_1.ApiOperation)({ summary: "Retrieve DM logs with a specific contact" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("contactId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "getMessages", null);
exports.SocialController = SocialController = __decorate([
    (0, swagger_1.ApiTags)("Social Graph & Discussions"),
    (0, common_1.Controller)("social"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [social_service_1.SocialService])
], SocialController);
//# sourceMappingURL=social.controller.js.map