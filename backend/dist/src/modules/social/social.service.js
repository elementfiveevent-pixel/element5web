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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SocialService = class SocialService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async follow(followerId, followingId) {
        if (followerId === followingId) {
            throw new common_1.ConflictException("You cannot follow yourself");
        }
        const existing = await this.prisma.follow.findUnique({
            where: { followerId_followingId: { followerId, followingId } },
        });
        if (existing) {
            throw new common_1.ConflictException("You are already following this user");
        }
        return this.prisma.follow.create({
            data: { followerId, followingId },
        });
    }
    async unfollow(followerId, followingId) {
        const existing = await this.prisma.follow.findUnique({
            where: { followerId_followingId: { followerId, followingId } },
        });
        if (!existing) {
            throw new common_1.NotFoundException("Relationship not found");
        }
        await this.prisma.follow.delete({
            where: { followerId_followingId: { followerId, followingId } },
        });
        return { success: true, message: "Unfollowed successfully" };
    }
    async createCommunity(createdById, name, description) {
        const existing = await this.prisma.community.findUnique({ where: { name } });
        if (existing) {
            throw new common_1.ConflictException("Community with this name already exists");
        }
        return this.prisma.$transaction(async (tx) => {
            const community = await tx.community.create({
                data: { name, description, createdById },
            });
            await tx.communityMember.create({
                data: {
                    communityId: community.id,
                    userId: createdById,
                    role: "OWNER",
                },
            });
            return community;
        });
    }
    async joinCommunity(userId, communityId) {
        const existing = await this.prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId } },
        });
        if (existing) {
            throw new common_1.ConflictException("You are already a member of this community");
        }
        return this.prisma.communityMember.create({
            data: { communityId, userId, role: "MEMBER" },
        });
    }
    async createPost(authorId, communityId, title, content) {
        const isMember = await this.prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId: authorId } },
        });
        if (!isMember) {
            throw new common_1.ConflictException("You must join the community to post");
        }
        return this.prisma.post.create({
            data: { communityId, authorId, title, content },
        });
    }
    async likePost(userId, postId) {
        const existing = await this.prisma.like.findUnique({
            where: { userId_postId: { userId, postId } },
        });
        if (existing) {
            await this.prisma.like.delete({
                where: { userId_postId: { userId, postId } },
            });
            return { liked: false };
        }
        await this.prisma.like.create({
            data: { userId, postId },
        });
        return { liked: true };
    }
    async addComment(authorId, postId, content) {
        return this.prisma.comment.create({
            data: { postId, authorId, content },
        });
    }
    async sendMessage(senderId, recipientId, content) {
        return this.prisma.message.create({
            data: { senderId, recipientId, content },
        });
    }
    async getMessages(userId, contactId) {
        return this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, recipientId: contactId },
                    { senderId: contactId, recipientId: userId },
                ],
            },
            orderBy: { createdAt: "asc" },
        });
    }
};
exports.SocialService = SocialService;
exports.SocialService = SocialService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SocialService);
//# sourceMappingURL=social.service.js.map