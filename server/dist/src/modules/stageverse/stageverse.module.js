"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StageVerseModule = void 0;
const common_1 = require("@nestjs/common");
const stageverse_service_1 = require("./stageverse.service");
const stageverse_controller_1 = require("./stageverse.controller");
const stageverse_gateway_1 = require("./stageverse.gateway");
let StageVerseModule = class StageVerseModule {
};
exports.StageVerseModule = StageVerseModule;
exports.StageVerseModule = StageVerseModule = __decorate([
    (0, common_1.Module)({
        controllers: [stageverse_controller_1.StageVerseController],
        providers: [stageverse_service_1.StageVerseService, stageverse_gateway_1.StageVerseGateway],
        exports: [stageverse_service_1.StageVerseService, stageverse_gateway_1.StageVerseGateway],
    })
], StageVerseModule);
//# sourceMappingURL=stageverse.module.js.map