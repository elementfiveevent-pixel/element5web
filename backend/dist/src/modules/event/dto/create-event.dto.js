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
exports.CreateEventDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateEventDto {
    title;
    description;
    category;
    status;
    maxCapacity;
    startDate;
    endDate;
    registrationEndDate;
    isPaid;
    price;
    audiencePrice;
    artistPrice;
    upiVpa;
    upiId;
    upiQrUrl;
    artistQrUrl;
    audienceQrUrl;
    flyerUrl;
    venueName;
    venueAddress;
    mapsLink;
    city;
    state;
    termsConditions;
    customFields;
}
exports.CreateEventDto = CreateEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Nexus Music Festival" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "The largest creator visual arts show.", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "STAGEVERSE", enum: client_1.EventCategory }),
    (0, class_validator_1.IsEnum)(client_1.EventCategory),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "PUBLISHED", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 500, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateEventDto.prototype, "maxCapacity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-10-15T18:00:00Z" }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-10-15T23:00:00Z", required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-10-12T23:59:00Z", required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "registrationEndDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateEventDto.prototype, "isPaid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0.00, required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateEventDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0.00, required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateEventDto.prototype, "audiencePrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0.00, required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateEventDto.prototype, "artistPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "nexus@upi", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "upiVpa", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "nexus@upi", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "upiId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "https://res.cloudinary.com/demo/image/upload/upi.png", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "upiQrUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "https://res.cloudinary.com/demo/image/upload/upi.png", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "artistQrUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "https://res.cloudinary.com/demo/image/upload/upi.png", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "audienceQrUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "https://res.cloudinary.com/demo/image/upload/flyer.png", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "flyerUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Digital Dome" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "venueName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "123 Cyber Way" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "venueAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "https://maps.google.com/?q=Digital+Dome", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "mapsLink", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "San Francisco" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "California" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Entry closes 15 minutes after start.", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "termsConditions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [{ label: "Instagram handle", type: "text", required: false }],
        required: false,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateEventDto.prototype, "customFields", void 0);
//# sourceMappingURL=create-event.dto.js.map