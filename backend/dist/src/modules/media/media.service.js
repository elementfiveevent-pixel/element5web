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
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_1 = require("cloudinary");
let MediaService = class MediaService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        cloudinary_1.v2.config({
            cloud_name: this.configService.get("CLOUDINARY_CLOUD_NAME") || "mock_cloud",
            api_key: this.configService.get("CLOUDINARY_API_KEY") || "mock_key",
            api_secret: this.configService.get("CLOUDINARY_API_SECRET") || "mock_secret",
        });
    }
    async getSignedUploadSignature(folder = "element5") {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const apiSecret = cloudinary_1.v2.config().api_secret;
        if (!apiSecret || apiSecret === "mock_secret") {
            return {
                timestamp,
                signature: "mock_signature_hash_2026",
                cloudName: cloudinary_1.v2.config().cloud_name,
                apiKey: cloudinary_1.v2.config().api_key,
                folder,
            };
        }
        const signature = cloudinary_1.v2.utils.sign_request({ timestamp, folder }, { api_secret: apiSecret });
        return {
            timestamp,
            signature,
            cloudName: cloudinary_1.v2.config().cloud_name,
            apiKey: cloudinary_1.v2.config().api_key,
            folder,
        };
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MediaService);
//# sourceMappingURL=media.service.js.map