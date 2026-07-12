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
exports.SubmitTrackDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class SubmitTrackDto {
    eventId;
    trackTitle;
    audioVideoUrl;
}
exports.SubmitTrackDto = SubmitTrackDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "e9e0c6e5-53ce-4eed-8afd-0ae0cb04ecfb" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubmitTrackDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Cyber Sunset (Live Synthesizer Set)" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubmitTrackDto.prototype, "trackTitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "https://cloudinary.com/video.mp4" }),
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubmitTrackDto.prototype, "audioVideoUrl", void 0);
//# sourceMappingURL=submit-track.dto.js.map