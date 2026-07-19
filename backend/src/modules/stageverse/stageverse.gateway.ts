import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Inject, forwardRef, Logger } from "@nestjs/common";
import { StageVerseService } from "./stageverse.service";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
      : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
    credentials: true,
  },
  namespace: "live",
})
export class StageVerseGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(StageVerseGateway.name);

  // Track user presence inside event namespaces
  private activeViewerCounts = new Map<string, number>();

  constructor(
    @Inject(forwardRef(() => StageVerseService))
    private stageVerseService: StageVerseService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    for (const [eventId, count] of this.activeViewerCounts.entries()) {
      if (client.rooms.has(eventId)) {
        const newCount = Math.max(0, count - 1);
        this.activeViewerCounts.set(eventId, newCount);
        this.server.to(eventId).emit("presenceUpdate", { viewerCount: newCount });
      }
    }
  }

  @SubscribeMessage("joinEvent")
  async handleJoinEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody("eventId") eventId: string,
  ) {
    client.join(eventId);
    const count = this.activeViewerCounts.get(eventId) || 0;
    const newCount = count + 1;
    this.activeViewerCounts.set(eventId, newCount);

    // Broadcast updated presence to event room
    this.server.to(eventId).emit("presenceUpdate", { viewerCount: newCount });

    // Send current standings to the joined client immediately
    const standings = await this.stageVerseService.calculateStandings(eventId);
    client.emit("leaderboardUpdate", standings);
  }

  broadcastLeaderboard(eventId: string, standings: any) {
    this.server.to(eventId).emit("leaderboardUpdate", standings);
  }

  broadcastLiveVote(eventId: string, voteDetails: any) {
    this.server.to(eventId).emit("liveVoteCast", voteDetails);
  }

  broadcastCurrentPerformer(eventId: string, submissionId: string | null) {
    this.server.to(eventId).emit("currentPerformerUpdate", { currentPerformerId: submissionId });
  }
}
