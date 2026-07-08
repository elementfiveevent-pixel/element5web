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
exports.ArtistController = void 0;
const common_1 = require("@nestjs/common");
const artist_service_1 = require("./artist.service");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let ArtistController = class ArtistController {
    artistService;
    constructor(artistService) {
        this.artistService = artistService;
    }
    async list(search, genre, isVerified, city, state, limit, offset) {
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
    async nearby(lat, lng, radius) {
        return this.artistService.searchNearby(lat, lng, radius);
    }
    async getProfile(user) {
        return this.artistService.getProfile(user.id);
    }
    async updateProfile(user, dto) {
        return this.artistService.updateProfile(user.id, dto);
    }
    async getByUserId(userId) {
        return this.artistService.getProfile(userId);
    }
};
exports.ArtistController = ArtistController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List and filter verified/unverified creator profiles" }),
    __param(0, (0, common_1.Query)("search")),
    __param(1, (0, common_1.Query)("genre")),
    __param(2, (0, common_1.Query)("isVerified")),
    __param(3, (0, common_1.Query)("city")),
    __param(4, (0, common_1.Query)("state")),
    __param(5, (0, common_1.Query)("limit")),
    __param(6, (0, common_1.Query)("offset")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], ArtistController.prototype, "list", null);
__decorate([
    (0, common_1.Get)("nearby"),
    (0, swagger_1.ApiOperation)({ summary: "Discover creators near a coordinate radius (Haversine)" }),
    __param(0, (0, common_1.Query)("latitude", common_1.ParseFloatPipe)),
    __param(1, (0, common_1.Query)("longitude", common_1.ParseFloatPipe)),
    __param(2, (0, common_1.Query)("radius", common_1.ParseFloatPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], ArtistController.prototype, "nearby", null);
__decorate([
    (0, common_1.Get)("profile"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get logged-in artist profile" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ArtistController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)("profile"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Update logged-in artist profile info" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateArtistProfileDto]),
    __metadata("design:returntype", Promise)
], ArtistController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)(":userId"),
    (0, swagger_1.ApiOperation)({ summary: "Get public creator profile by user ID" }),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ArtistController.prototype, "getByUserId", null);
exports.ArtistController = ArtistController = __decorate([
    (0, swagger_1.ApiTags)("Creators & Artists"),
    (0, common_1.Controller)("artists"),
    __metadata("design:paramtypes", [artist_service_1.ArtistService])
], ArtistController);
//# sourceMappingURL=artist.controller.js.map