import { ArtistService } from "./artist.service";
import { UpdateArtistProfileDto } from "./dto/update-profile.dto";
export declare class ArtistController {
    private artistService;
    constructor(artistService: ArtistService);
    list(search?: string, genre?: string, isVerified?: string, city?: string, state?: string, limit?: number, offset?: number): Promise<any>;
    nearby(lat: number, lng: number, radius?: number): Promise<any>;
    getProfile(user: any): Promise<any>;
    updateProfile(user: any, dto: UpdateArtistProfileDto): Promise<any>;
    getByUserId(userId: string): Promise<any>;
}
