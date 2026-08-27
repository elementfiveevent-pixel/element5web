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
    if (!eventId) return;
    client.join(eventId);

    try {
      const event = await this.stageVerseService.getRealEvent(eventId);
      if (event?.id) client.join(event.id);
      if (event?.slug) client.join(event.slug);
    } catch {}

    const count = (this.activeViewerCounts.get(eventId) || 0) + 1;
    this.activeViewerCounts.set(eventId, count);

    // Broadcast updated presence to event room
    this.server.to(eventId).emit("presenceUpdate", { viewerCount: count });

    // Send current standings & live states to the joined client immediately
    try {
      const standings = await this.stageVerseService.calculateStandings(eventId);
      client.emit("leaderboardUpdate", standings);

      const status = await this.stageVerseService.getVotingStatus(eventId);
      client.emit("panelStatusUpdate", { panelOpen: status.panelOpen });
      client.emit("votingStatusUpdate", { open: status.open, expiresAt: status.expiresAt });
      client.emit("performanceStatusUpdate", { performanceLive: status.performanceLive, expiresAt: status.performanceExpiresAt });
      client.emit("currentPerformerUpdate", { currentPerformerId: status.currentPerformerId });
    } catch {}
  }

  async broadcastLeaderboard(eventId: string, standings: any) {
    this.server.to(eventId).emit("leaderboardUpdate", standings);
    try {
      const event = await this.stageVerseService.getRealEvent(eventId);
      if (event?.id && event.id !== eventId) this.server.to(event.id).emit("leaderboardUpdate", standings);
      if (event?.slug && event.slug !== eventId) this.server.to(event.slug).emit("leaderboardUpdate", standings);
    } catch {}
  }

  async broadcastLiveVote(eventId: string, voteDetails: any) {
    this.server.to(eventId).emit("liveVoteCast", voteDetails);
    try {
      const event = await this.stageVerseService.getRealEvent(eventId);
      if (event?.id && event.id !== eventId) this.server.to(event.id).emit("liveVoteCast", voteDetails);
      if (event?.slug && event.slug !== eventId) this.server.to(event.slug).emit("liveVoteCast", voteDetails);
    } catch {}
  }

  async broadcastCurrentPerformer(eventId: string, submissionId: string | null) {
    const payload = { currentPerformerId: submissionId };
    this.server.to(eventId).emit("currentPerformerUpdate", payload);
    try {
      const event = await this.stageVerseService.getRealEvent(eventId);
      if (event?.id && event.id !== eventId) this.server.to(event.id).emit("currentPerformerUpdate", payload);
      if (event?.slug && event.slug !== eventId) this.server.to(event.slug).emit("currentPerformerUpdate", payload);
    } catch {}
  }

  async broadcastVotingAccessUpdate(eventId: string, userId: string, status: string) {
    const payload = { eventId, userId, status };
    this.server.to(eventId).emit("votingAccessUpdate", payload);
    try {
      const event = await this.stageVerseService.getRealEvent(eventId);
      if (event?.id && event.id !== eventId) this.server.to(event.id).emit("votingAccessUpdate", payload);
      if (event?.slug && event.slug !== eventId) this.server.to(event.slug).emit("votingAccessUpdate", payload);
    } catch {}
  }

  async broadcastVotingAccessRequest(eventId: string, userId: string, request: any) {
    const payload = { eventId, userId, request };
    this.server.to(eventId).emit("votingAccessRequested", payload);
    try {
      const event = await this.stageVerseService.getRealEvent(eventId);
      if (event?.id && event.id !== eventId) this.server.to(event.id).emit("votingAccessRequested", payload);
      if (event?.slug && event.slug !== eventId) this.server.to(event.slug).emit("votingAccessRequested", payload);
    } catch {}
  }

  @SubscribeMessage("stage_reaction")
  async handleStageReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventId?: string; emoji?: string }
  ) {
    const eventId = data?.eventId;
    if (eventId) {
      const payload = {
        id: Math.random().toString(36).substring(2, 9),
        emoji: data.emoji || "🔥",
      };
      this.server.to(eventId).emit("stage_reaction", payload);
      try {
        const event = await this.stageVerseService.getRealEvent(eventId);
        if (event?.id && event.id !== eventId) this.server.to(event.id).emit("stage_reaction", payload);
        if (event?.slug && event.slug !== eventId) this.server.to(event.slug).emit("stage_reaction", payload);
      } catch {}
    }
  }
}
