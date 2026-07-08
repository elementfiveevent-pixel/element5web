import { OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
export declare class MediaService implements OnModuleInit {
    private configService;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    getSignedUploadSignature(folder?: string): Promise<{
        timestamp: number;
        signature: string;
        cloudName: string | undefined;
        apiKey: string | undefined;
        folder: string;
    } | {
        timestamp: number;
        signature: {
            [key: string]: any;
            signature: string;
            api_key: string;
        };
        cloudName: string | undefined;
        apiKey: string | undefined;
        folder: string;
    }>;
}
