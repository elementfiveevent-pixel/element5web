import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
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
  @Roles(UserRole.JUDGE, UserRole.SUPER_ADMIN)
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
  async vote(@CurrentUser() user: any, @Param("submissionId") subId: string) {
    return this.stageVerseService.castVote(user.id, subId);
  }

  @Get(":eventId/standings")
  @ApiOperation({ summary: "Get current score standings for an event" })
  async getStandings(@Param("eventId") eventId: string) {
    return this.stageVerseService.calculateStandings(eventId);
  }
}
