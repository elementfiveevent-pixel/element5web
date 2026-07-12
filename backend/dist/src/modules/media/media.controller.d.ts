import { MediaService } from "./media.service";
export declare class MediaController {
    private mediaService;
    constructor(mediaService: MediaService);
    getSignature(folder?: string): Promise<{
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
