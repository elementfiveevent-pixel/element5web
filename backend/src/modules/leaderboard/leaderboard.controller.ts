import { Controller, Get, Query } from "@nestjs/common";
import { LeaderboardService } from "./leaderboard.service";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Leaderboards Engine")
@Controller("leaderboard")
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get("events")
  @ApiOperation({ summary: "Get all events that have conducted voting" })
  async getEvents() {
    return this.leaderboardService.getVotingEvents();
  }

  @Get()
  @ApiOperation({ summary: "Fetch current leaderboards filtered by timeframe (ALL_TIME, MONTHLY, EVENT)" })
  async get(
    @Query("timeframe") timeframe?: string,
    @Query("eventId") eventId?: string,
    @Query("limit") limit?: number,
  ) {
    const timeframeKey = timeframe ? timeframe.toUpperCase() : "ALL_TIME";
    return this.leaderboardService.getGlobalLeaderboard(timeframeKey, eventId, limit);
  }
}
