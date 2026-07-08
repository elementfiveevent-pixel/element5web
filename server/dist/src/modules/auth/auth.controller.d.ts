import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            roles: import("@prisma/client").$Enums.UserRole[];
        };
    }>;
    logout(refreshToken: string): Promise<{
        success: boolean;
        message: string;
    }>;
    me(user: any): Promise<any>;
}
