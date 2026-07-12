import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { StageVerseService } from "./stageverse.service";
export declare class StageVerseGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private stageVerseService;
    server: Server;
    private activeViewerCounts;
    constructor(stageVerseService: StageVerseService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinEvent(client: Socket, eventId: string): Promise<void>;
    broadcastLeaderboard(eventId: string, standings: any): void;
    broadcastLiveVote(eventId: string, voteDetails: any): void;
}
