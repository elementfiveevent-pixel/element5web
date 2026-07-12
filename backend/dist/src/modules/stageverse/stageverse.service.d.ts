import { PrismaService } from "../../prisma/prisma.service";
import { SubmitTrackDto } from "./dto/submit-track.dto";
import { SubmitScoreDto } from "./dto/submit-score.dto";
import { StageVerseGateway } from "./stageverse.gateway";
export declare class StageVerseService {
    private prisma;
    private gateway;
    constructor(prisma: PrismaService, gateway: StageVerseGateway);
    private votingStates;
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
    submitTrack(userId: string, dto: SubmitTrackDto): Promise<any>;
    listSubmissions(eventId: string): Promise<any[]>;
    submitJudgeScore(judgeId: string, submissionId: string, dto: SubmitScoreDto): Promise<any>;
    castVote(voterId: string, submissionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    calculateStandings(eventId: string): Promise<{
        submissionId: any;
        performer: any;
        photoUrl: any;
        trackTitle: any;
        votesCount: any;
        judgeAverage: number;
        totalScore: number;
    }[]>;
}
