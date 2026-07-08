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
exports.RegisterEventDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RegisterEventDto {
    customData;
    paymentScreenshotUrl;
}
exports.RegisterEventDto = RegisterEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: { experienceLevel: "Advanced" }, description: "Dynamic metadata matching custom question fields", required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], RegisterEventDto.prototype, "customData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "https://cloudinary.com/payment.png", description: "Reference URL for manual payment reconciliation", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterEventDto.prototype, "paymentScreenshotUrl", void 0);
//# sourceMappingURL=register-event.dto.js.map