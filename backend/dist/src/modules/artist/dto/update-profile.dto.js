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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateArtistProfileDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("../../../prisma-stub.ts");
class UpdateArtistProfileDto {
    stageName;
    biography;
    portfolioUrls;
    genres;
    skills;
    languages;
    availabilityStatus;
}
exports.UpdateArtistProfileDto = UpdateArtistProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "DJ Zenith", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateArtistProfileDto.prototype, "stageName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Producer of progressive techno beats.", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateArtistProfileDto.prototype, "biography", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["https://youtube.com/my-set"], required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateArtistProfileDto.prototype, "portfolioUrls", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["Electronic", "Techno"], required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateArtistProfileDto.prototype, "genres", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["Synthesizers", "DJing"], required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateArtistProfileDto.prototype, "skills", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["English", "Spanish"], required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateArtistProfileDto.prototype, "languages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "AVAILABLE", enum: client_1.AvailabilityStatus, required: false }),
    (0, class_validator_1.IsEnum)(client_1.AvailabilityStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateArtistProfileDto.prototype, "availabilityStatus", void 0);
//# sourceMappingURL=update-profile.dto.js.map