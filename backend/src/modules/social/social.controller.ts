import { Controller, Get, Post, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { SocialService } from "./social.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Social Graph & Discussions")
@Controller("social")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialController {
  constructor(private socialService: SocialService) {}

  @Post("follow/:userId")
  @ApiOperation({ summary: "Follow a creator or peer" })
  async follow(@CurrentUser() user: any, @Param("userId") followingId: string) {
    return this.socialService.follow(user.id, followingId);
  }

  @Delete("follow/:userId")
  @ApiOperation({ summary: "Unfollow a creator or peer" })
  async unfollow(@CurrentUser() user: any, @Param("userId") followingId: string) {
    return this.socialService.unfollow(user.id, followingId);
  }

  @Get("communities")
  @ApiOperation({ summary: "Get all community hubs" })
  async getCommunities() {
    return this.socialService.getCommunities();
  }

  @Get("communities/:communityId/posts")
  @ApiOperation({ summary: "Get posts of a community" })
  async getCommunityPosts(@Param("communityId") communityId: string) {
    return this.socialService.getCommunityPosts(communityId);
  }

  @Post("communities")
  @ApiOperation({ summary: "Create a new guild or community hub" })
  async createCommunity(
    @CurrentUser() user: any,
    @Body("name") name: string,
    @Body("description") description?: string,
  ) {
    return this.socialService.createCommunity(user.id, name, description);
  }

  @Post("communities/:communityId/join")
  @ApiOperation({ summary: "Join an active community" })
  async joinCommunity(@CurrentUser() user: any, @Param("communityId") communityId: string) {
    return this.socialService.joinCommunity(user.id, communityId);
  }

  @Post("communities/:communityId/posts")
  @ApiOperation({ summary: "Write a post in a community hub" })
  async createPost(
    @CurrentUser() user: any,
    @Param("communityId") communityId: string,
    @Body("title") title: string,
    @Body("content") content: string,
  ) {
    return this.socialService.createPost(user.id, communityId, title, content);
  }

  @Delete("posts/:postId")
  @ApiOperation({ summary: "Delete your post" })
  async deletePost(@CurrentUser() user: any, @Param("postId") postId: string) {
    return this.socialService.deletePost(user.id, postId);
  }

  @Post("posts/:postId/like")
  @ApiOperation({ summary: "Toggle like status on a post" })
  async likePost(@CurrentUser() user: any, @Param("postId") postId: string) {
    return this.socialService.likePost(user.id, postId);
  }

  @Post("posts/:postId/comments")
  @ApiOperation({ summary: "Comment on a discussion post" })
  async addComment(
    @CurrentUser() user: any,
    @Param("postId") postId: string,
    @Body("content") content: string,
  ) {
    return this.socialService.addComment(user.id, postId, content);
  }

  @Post("messages")
  @ApiOperation({ summary: "Send a direct private message" })
  async sendMessage(
    @CurrentUser() user: any,
    @Body("recipientId") recipientId: string,
    @Body("content") content: string,
  ) {
    return this.socialService.sendMessage(user.id, recipientId, content);
  }

  @Get("messages/:contactId")
  @ApiOperation({ summary: "Retrieve DM logs with a specific contact" })
  async getMessages(@CurrentUser() user: any, @Param("contactId") contactId: string) {
    return this.socialService.getMessages(user.id, contactId);
  }

  @Get("contacts")
  @ApiOperation({ summary: "Get all registered users as contacts for DMs" })
  async getContacts(@CurrentUser() user: any) {
    return this.socialService.getContacts(user.id);
  }
}
