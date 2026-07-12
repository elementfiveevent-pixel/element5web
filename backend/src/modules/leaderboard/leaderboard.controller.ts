import { Controller, Get, Query } from "@nestjs/common";
import { LeaderboardService } from "./leaderboard.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Leaderboards Engine")
@Controller("leaderboard")
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: "Fetch current leaderboards filtered by timeframe (Weekly, Monthly, Season, All Time)" })
  async get(
    @Query("timeframe") timeframe?: string,
    @Query("limit") limit?: number,
  ) {
    const timeframeKey = timeframe ? timeframe.toUpperCase() : "ALL_TIME";
    return this.leaderboardService.getGlobalLeaderboard(timeframeKey, limit);
  }
}
