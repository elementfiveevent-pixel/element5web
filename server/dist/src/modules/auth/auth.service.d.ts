import { PrismaService } from "../../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            roles: import("@prisma/client").$Enums.UserRole[];
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            roles: import("@prisma/client").$Enums.UserRole[];
        };
    }>;
    refreshTokens(refreshTokenString: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            roles: import("@prisma/client").$Enums.UserRole[];
        };
    }>;
    logout(refreshTokenString: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private generateTokens;
}
