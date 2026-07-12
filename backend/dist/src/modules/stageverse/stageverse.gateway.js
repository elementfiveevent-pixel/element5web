"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StageVerseGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const stageverse_service_1 = require("./stageverse.service");
let StageVerseGateway = class StageVerseGateway {
    stageVerseService;
    server;
    activeViewerCounts = new Map();
    constructor(stageVerseService) {
        this.stageVerseService = stageVerseService;
    }
    handleConnection(client) {
        console.log(`🔌 Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`🔌 Client disconnected: ${client.id}`);
        for (const [eventId, count] of this.activeViewerCounts.entries()) {
            if (client.rooms.has(eventId)) {
                const newCount = Math.max(0, count - 1);
                this.activeViewerCounts.set(eventId, newCount);
                this.server.to(eventId).emit("presenceUpdate", { viewerCount: newCount });
            }
        }
    }
    async handleJoinEvent(client, eventId) {
        client.join(eventId);
        const count = this.activeViewerCounts.get(eventId) || 0;
        const newCount = count + 1;
        this.activeViewerCounts.set(eventId, newCount);
        this.server.to(eventId).emit("presenceUpdate", { viewerCount: newCount });
        const standings = await this.stageVerseService.calculateStandings(eventId);
        client.emit("leaderboardUpdate", standings);
    }
    broadcastLeaderboard(eventId, standings) {
        this.server.to(eventId).emit("leaderboardUpdate", standings);
    }
    broadcastLiveVote(eventId, voteDetails) {
        this.server.to(eventId).emit("liveVoteCast", voteDetails);
    }
};
exports.StageVerseGateway = StageVerseGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], StageVerseGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)("joinEvent"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)("eventId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], StageVerseGateway.prototype, "handleJoinEvent", null);
exports.StageVerseGateway = StageVerseGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: "*" },
        namespace: "live",
    }),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => stageverse_service_1.StageVerseService))),
    __metadata("design:paramtypes", [stageverse_service_1.StageVerseService])
], StageVerseGateway);
//# sourceMappingURL=stageverse.gateway.js.map