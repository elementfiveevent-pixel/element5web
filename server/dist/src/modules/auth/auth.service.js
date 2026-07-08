"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.ConflictException("An account with this email already exists");
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(dto.password, salt);
        const role = dto.role || client_1.UserRole.AUDIENCE;
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                fullName: dto.fullName,
                mobileNumber: dto.mobileNumber,
                roles: {
                    create: { role },
                },
            },
            include: {
                roles: true,
            },
        });
        if (role === client_1.UserRole.ARTIST) {
            await this.prisma.artistProfile.create({
                data: {
                    userId: user.id,
                    stageName: dto.fullName,
                },
            });
        }
        return this.generateTokens(user.id, user.email, user.roles.map((r) => r.role));
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { roles: true },
        });
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException("Invalid email or password");
        }
        if (user.status === "SUSPENDED") {
            throw new common_1.UnauthorizedException("This account has been suspended");
        }
        const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
        if (!validPassword) {
            throw new common_1.UnauthorizedException("Invalid email or password");
        }
        return this.generateTokens(user.id, user.email, user.roles.map((r) => r.role));
    }
    async refreshTokens(refreshTokenString) {
        const tokenRecord = await this.prisma.refreshToken.findUnique({
            where: { token: refreshTokenString },
            include: { user: { include: { roles: true } } },
        });
        if (!tokenRecord || tokenRecord.isUsed || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException("Refresh token is invalid, used, or expired");
        }
        await this.prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { isUsed: true },
        });
        const user = tokenRecord.user;
        return this.generateTokens(user.id, user.email, user.roles.map((r) => r.role));
    }
    async logout(refreshTokenString) {
        await this.prisma.refreshToken.updateMany({
            where: { token: refreshTokenString },
            data: { isRevoked: true },
        });
        return { success: true, message: "Logged out successfully" };
    }
    async generateTokens(userId, email, roles) {
        const payload = { sub: userId, email, roles };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: "15m",
        });
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: "7d",
        });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                token: refreshToken,
                expiresAt,
            },
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: userId,
                email,
                roles,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map