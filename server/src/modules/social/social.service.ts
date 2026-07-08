import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  // 1. Follow / Unfollow System
  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ConflictException("You cannot follow yourself");
    }

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      throw new ConflictException("You are already following this user");
    }

    return this.prisma.follow.create({
      data: { followerId, followingId },
    });
  }

  async unfollow(followerId: string, followingId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (!existing) {
      throw new NotFoundException("Relationship not found");
    }

    await this.prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });

    return { success: true, message: "Unfollowed successfully" };
  }

  // 2. Communities & Guilds
  async createCommunity(createdById: string, name: string, description?: string) {
    const existing = await this.prisma.community.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictException("Community with this name already exists");
    }

    return this.prisma.$transaction(async (tx) => {
      const community = await tx.community.create({
        data: { name, description, createdById },
      });

      // Join the creator as the Owner
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

  async joinCommunity(userId: string, communityId: string) {
    const existing = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });

    if (existing) {
      throw new ConflictException("You are already a member of this community");
    }

    return this.prisma.communityMember.create({
      data: { communityId, userId, role: "MEMBER" },
    });
  }

  // 3. Posts & Comments
  async createPost(authorId: string, communityId: string, title: string, content: string) {
    const isMember = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: authorId } },
    });
    if (!isMember) {
      throw new ConflictException("You must join the community to post");
    }

    return this.prisma.post.create({
      data: { communityId, authorId, title, content },
    });
  }

  async likePost(userId: string, postId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      // Toggle off (unlike)
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

  async addComment(authorId: string, postId: string, content: string) {
    return this.prisma.comment.create({
      data: { postId, authorId, content },
    });
  }

  // 4. Direct Messaging
  async sendMessage(senderId: string, recipientId: string, content: string) {
    return this.prisma.message.create({
      data: { senderId, recipientId, content },
    });
  }

  async getMessages(userId: string, contactId: string) {
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
}
