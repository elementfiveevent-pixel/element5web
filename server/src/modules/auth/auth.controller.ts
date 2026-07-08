import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new creator or audience account" })
  @ApiResponse({ status: 201, description: "Account created successfully" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate credentials and get tokens" })
  @ApiResponse({ status: 200, description: "Logged in successfully" })
  @ApiResponse({ status: 401, description: "Invalid email or password" })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate tokens using a valid refresh token" })
  @ApiResponse({ status: 200, description: "Tokens rotated successfully" })
  @ApiResponse({ status: 401, description: "Token is invalid, used, or expired" })
  async refresh(@Body("refreshToken") refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Revoke an active session refresh token" })
  async logout(@Body("refreshToken") refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get verified user details from request JWT" })
  async me(@CurrentUser() user: any) {
    return user;
  }
}
