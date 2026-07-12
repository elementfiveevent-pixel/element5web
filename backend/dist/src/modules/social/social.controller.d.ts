import { SocialService } from "./social.service";
export declare class SocialController {
    private socialService;
    constructor(socialService: SocialService);
    follow(user: any, followingId: string): Promise<any>;
    unfollow(user: any, followingId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    createCommunity(user: any, name: string, description?: string): Promise<any>;
    joinCommunity(user: any, communityId: string): Promise<any>;
    createPost(user: any, communityId: string, title: string, content: string): Promise<any>;
    likePost(user: any, postId: string): Promise<{
        liked: boolean;
    }>;
    addComment(user: any, postId: string, content: string): Promise<any>;
    sendMessage(user: any, recipientId: string, content: string): Promise<any>;
    getMessages(user: any, contactId: string): Promise<any[]>;
}
