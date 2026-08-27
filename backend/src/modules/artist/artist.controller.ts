import { Controller, Get, Put, Body, Query, UseGuards, Param, ParseFloatPipe, ParseIntPipe } from "@nestjs/common";
import { ArtistService } from "./artist.service";
import { UpdateArtistProfileDto } from "./dto/update-profile.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Creators & Artists")
@Controller("artists")
export class ArtistController {
  constructor(private artistService: ArtistService) {}

  @Get()
  @ApiOperation({ summary: "List and filter verified/unverified creator profiles" })
  async list(
    @Query("search") search?: string,
    @Query("genre") genre?: string,
    @Query("isVerified") isVerified?: string,
    @Query("city") city?: string,
    @Query("state") state?: string,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
  ) {
    const verifiedFlag = isVerified === "true" ? true : isVerified === "false" ? false : undefined;
    return this.artistService.listArtists({
      search,
      genre,
      isVerified: verifiedFlag,
      city,
      state,
      limit,
      offset,
    });
  }

  @Get("nearby")
  @ApiOperation({ summary: "Discover creators near a coordinate radius (Haversine)" })
  async nearby(
    @Query("latitude", ParseFloatPipe) lat: number,
    @Query("longitude", ParseFloatPipe) lng: number,
    @Query("radius", ParseFloatPipe) radius?: number,
  ) {
    return this.artistService.searchNearby(lat, lng, radius);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get logged-in artist profile" })
  async getProfile(@CurrentUser() user: any) {
    return this.artistService.getProfile(user.id);
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update logged-in artist profile info" })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateArtistProfileDto) {
    return this.artistService.updateProfile(user.id, dto);
  }

  @Get(":userId")
  @ApiOperation({ summary: "Get public creator profile by user ID" })
  async getByUserId(@Param("userId") userId: string) {
    return this.artistService.getProfile(userId);
  }
}
