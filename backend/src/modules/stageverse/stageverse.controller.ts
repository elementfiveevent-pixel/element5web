import { Controller, Get, Post, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { StageVerseService } from "./stageverse.service";
import { SubmitTrackDto } from "./dto/submit-track.dto";
import { SubmitScoreDto } from "./dto/submit-score.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("StageVerse Live Arena")
@Controller("stageverse")
export class StageVerseController {
  constructor(private stageVerseService: StageVerseService) {}

  @Post("submit")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Artists submit performance track for StageVerse contest" })
  async submit(@CurrentUser() user: any, @Body() dto: SubmitTrackDto) {
    return this.stageVerseService.submitTrack(user.id, dto);
  }

  @Get(":eventId/submissions")
  @ApiOperation({ summary: "Get approved submissions for an event" })
  async getSubmissions(@Param("eventId") eventId: string) {
    return this.stageVerseService.listSubmissions(eventId);
  }

  @Post("submissions/:submissionId/score")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Authorized judges submit score metrics" })
  async score(
    @CurrentUser() user: any,
    @Param("submissionId") subId: string,
    @Body() dto: SubmitScoreDto,
  ) {
    return this.stageVerseService.submitJudgeScore(user.id, subId, dto);
  }

  @Post("submissions/:submissionId/vote")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Audience cast vote for active performance slot" })
  async vote(
    @CurrentUser() user: any,
    @Param("submissionId") subId: string,
    @Body("score") score?: number
  ) {
    return this.stageVerseService.castVote(user.id, subId, score);
  }

  @Post(":eventId/voting/toggle")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Organizers toggle live voting status for an event" })
  async toggleVoting(
    @CurrentUser() user: any,
    @Param("eventId") eventId: string,
    @Body("open") open: boolean,
    @Body("durationSeconds") durationSeconds?: number,
  ) {
    return this.stageVerseService.toggleVoting(user.id, user.roles, eventId, open, durationSeconds);
  }

  @Get(":eventId/voting/status")
  @ApiOperation({ summary: "Get voting status (open/closed) for an event" })
  async getVotingStatus(@Param("eventId") eventId: string) {
    return this.stageVerseService.getVotingStatus(eventId);
  }

  @Post(":eventId/voting/reset")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Organizers reset all votes for an event" })
  async resetVotes(@CurrentUser() user: any, @Param("eventId") eventId: string) {
    return this.stageVerseService.resetVotes(user.id, user.roles, eventId);
  }

  @Get(":eventId/standings")
  @ApiOperation({ summary: "Get current score standings for an event" })
  async getStandings(@Param("eventId") eventId: string) {
    return this.stageVerseService.calculateStandings(eventId);
  }

  @Post(":eventId/leaderboard/toggle")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Organizers toggle leaderboard visibility for an event" })
  async toggleLeaderboard(
    @CurrentUser() user: any,
    @Param("eventId") eventId: string,
    @Body("show") show: boolean,
  ) {
    return this.stageVerseService.toggleLeaderboard(user.id, user.roles, eventId, show);
  }

  @Post(":eventId/submissions/add-unregistered")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Organizers add an unregistered performer to an event" })
  async addUnregistered(
    @CurrentUser() user: any,
    @Param("eventId") eventId: string,
    @Body("performerName") performerName: string,
    @Body("trackTitle") trackTitle: string,
    @Body("audioVideoUrl") audioVideoUrl?: string,
  ) {
    return this.stageVerseService.addUnregisteredArtist(user.id, user.roles, eventId, performerName, trackTitle, audioVideoUrl);
  }

  @Post(":eventId/submissions/add-registered")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Organizers add a registered artist to an event" })
  async addRegistered(
    @CurrentUser() user: any,
    @Param("eventId") eventId: string,
    @Body("artistUserId") artistUserId: string,
    @Body("trackTitle") trackTitle: string,
    @Body("audioVideoUrl") audioVideoUrl?: string,
  ) {
    return this.stageVerseService.addRegisteredArtist(user.id, user.roles, eventId, artistUserId, trackTitle, audioVideoUrl);
  }

  @Post(":eventId/voting/request-access")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Attendees request voting access for an event" })
  async requestAccess(@CurrentUser() user: any, @Param("eventId") eventId: string) {
    return this.stageVerseService.requestVotingAccess(eventId, user.id);
  }

  @Get(":eventId/voting/access-requests")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Organizers list voting access requests for an event" })
  async listAccessRequests(@CurrentUser() user: any, @Param("eventId") eventId: string) {
    return this.stageVerseService.listVotingAccessRequests(user.id, user.roles, eventId);
  }

  @Get(":eventId/registered-artists")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List artist profiles registered for an event" })
  async getRegisteredArtists(@CurrentUser() user: any, @Param("eventId") eventId: string) {
    return this.stageVerseService.getRegisteredArtists(user.id, user.roles, eventId);
  }

  @Post("voting/access-requests/:requestId/review")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Organizers approve or reject a voting access request" })
  async reviewAccessRequest(
    @CurrentUser() user: any,
    @Param("requestId") requestId: string,
    @Body("status") status: "APPROVED" | "REJECTED"
  ) {
    return this.stageVerseService.reviewVotingAccessRequest(user.id, user.roles, requestId, status);
  }

  @Post("submissions/:submissionId/details")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Organizers edit track title and guest performer name" })
  async updateDetails(
    @CurrentUser() user: any,
    @Param("submissionId") submissionId: string,
    @Body("trackTitle") trackTitle?: string,
    @Body("performerName") performerName?: string,
  ) {
    return this.stageVerseService.updateSubmissionDetails(user.id, user.roles, submissionId, { trackTitle, performerName });
  }

  @Post("submissions/:submissionId/order")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Organizers update performer lineup order" })
  async updateOrder(
    @CurrentUser() user: any,
    @Param("submissionId") submissionId: string,
    @Body("performanceOrder") performanceOrder: number,
  ) {
    return this.stageVerseService.updateSubmissionOrder(user.id, user.roles, submissionId, performanceOrder);
  }

  @Post("submissions/:submissionId/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Organizers skip or unskip a performer" })
  async updateStatus(
    @CurrentUser() user: any,
    @Param("submissionId") submissionId: string,
    @Body("status") status: string,
  ) {
    return this.stageVerseService.updateSubmissionStatus(user.id, user.roles, submissionId, status);
  }

  @Delete("submissions/:submissionId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Organizers delete a performer from the lineup" })
  async deleteSub(
    @CurrentUser() user: any,
    @Param("submissionId") submissionId: string,
  ) {
    return this.stageVerseService.deleteSubmission(user.id, user.roles, submissionId);
  }

  @Get(":eventId/voting/check-access")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Check if the current user has access to vote in this event" })
  async checkAccess(@CurrentUser() user: any, @Param("eventId") eventId: string) {
    return this.stageVerseService.checkVotingAccess(eventId, user.id);
  }

  @Post(":eventId/current-performer")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Set the current active performer for per-performer voting rounds" })
  async setCurrentPerformer(
    @CurrentUser() user: any,
    @Param("eventId") eventId: string,
    @Body("submissionId") submissionId: string | null,
  ) {
    return this.stageVerseService.setCurrentPerformer(user.id, user.roles, eventId, submissionId);
  }

  @Post(":eventId/submissions/add-bulk")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Bulk add unregistered performers to an event lineup" })
  async addBulk(
    @CurrentUser() user: any,
    @Param("eventId") eventId: string,
    @Body("names") names: string[],
  ) {
    return this.stageVerseService.addBulkUnregisteredArtists(user.id, user.roles, eventId, names);
  }
}
