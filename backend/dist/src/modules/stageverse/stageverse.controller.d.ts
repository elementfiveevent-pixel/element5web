import { StageVerseService } from "./stageverse.service";
import { SubmitTrackDto } from "./dto/submit-track.dto";
import { SubmitScoreDto } from "./dto/submit-score.dto";
export declare class StageVerseController {
    private stageVerseService;
    constructor(stageVerseService: StageVerseService);
    submit(user: any, dto: SubmitTrackDto): Promise<any>;
    getSubmissions(eventId: string): Promise<any>;
    score(user: any, subId: string, dto: SubmitScoreDto): Promise<any>;
    vote(user: any, subId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    toggleVoting(eventId: string, open: boolean): Promise<{
        success: boolean;
        open: boolean;
    }>;
    getVotingStatus(eventId: string): Promise<{
        open: boolean;
    }>;
    resetVotes(eventId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getStandings(eventId: string): Promise<any>;
}
