import { PrismaService } from "../../prisma/prisma.service";
export declare class SocialService {
    private prisma;
    constructor(prisma: PrismaService);
    follow(followerId: string, followingId: string): Promise<{
        id: string;
        createdAt: Date;
        followerId: string;
        followingId: string;
    }>;
    unfollow(followerId: string, followingId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    createCommunity(createdById: string, name: string, description?: string): Promise<{
        id: string;
        description: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        bannerUrl: string | null;
        createdById: string;
    }>;
    joinCommunity(userId: string, communityId: string): Promise<{
        id: string;
        role: string;
        userId: string;
        communityId: string;
        joinedAt: Date;
    }>;
    createPost(authorId: string, communityId: string, title: string, content: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        communityId: string;
        authorId: string;
        content: string;
        mediaUrls: string[];
    }>;
    likePost(userId: string, postId: string): Promise<{
        liked: boolean;
    }>;
    addComment(authorId: string, postId: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
        content: string;
        postId: string;
    }>;
    sendMessage(senderId: string, recipientId: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        isRead: boolean;
        senderId: string;
        recipientId: string;
    }>;
    getMessages(userId: string, contactId: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        isRead: boolean;
        senderId: string;
        recipientId: string;
    }[]>;
}
