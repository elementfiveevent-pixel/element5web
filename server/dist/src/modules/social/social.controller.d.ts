import { SocialService } from "./social.service";
export declare class SocialController {
    private socialService;
    constructor(socialService: SocialService);
    follow(user: any, followingId: string): Promise<{
        id: string;
        createdAt: Date;
        followerId: string;
        followingId: string;
    }>;
    unfollow(user: any, followingId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    createCommunity(user: any, name: string, description?: string): Promise<{
        id: string;
        description: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        bannerUrl: string | null;
        createdById: string;
    }>;
    joinCommunity(user: any, communityId: string): Promise<{
        id: string;
        role: string;
        userId: string;
        communityId: string;
        joinedAt: Date;
    }>;
    createPost(user: any, communityId: string, title: string, content: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        communityId: string;
        authorId: string;
        content: string;
        mediaUrls: string[];
    }>;
    likePost(user: any, postId: string): Promise<{
        liked: boolean;
    }>;
    addComment(user: any, postId: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
        content: string;
        postId: string;
    }>;
    sendMessage(user: any, recipientId: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        isRead: boolean;
        senderId: string;
        recipientId: string;
    }>;
    getMessages(user: any, contactId: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        isRead: boolean;
        senderId: string;
        recipientId: string;
    }[]>;
}
