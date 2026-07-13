import { PrismaService } from "../../prisma/prisma.service";
export declare class SocialService {
    private prisma;
    constructor(prisma: PrismaService);
    follow(followerId: string, followingId: string): Promise<any>;
    unfollow(followerId: string, followingId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    createCommunity(createdById: string, name: string, description?: string): Promise<any>;
    joinCommunity(userId: string, communityId: string): Promise<any>;
    createPost(authorId: string, communityId: string, title: string, content: string): Promise<any>;
    likePost(userId: string, postId: string): Promise<{
        liked: boolean;
    }>;
    addComment(authorId: string, postId: string, content: string): Promise<any>;
    sendMessage(senderId: string, recipientId: string, content: string): Promise<any>;
    getMessages(userId: string, contactId: string): Promise<any>;
}
