import { LeaderboardService } from "./leaderboard.service";
export declare class LeaderboardController {
    private leaderboardService;
    constructor(leaderboardService: LeaderboardService);
    get(timeframe?: string, limit?: number): Promise<any>;
}
