import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Pool, PoolClient } from "pg";
export declare class PostgresModel {
    private pool;
    private tableName;
    private service;
    constructor(pool: Pool | PoolClient, tableName: string, service: any);
    private tableColumns;
    getTableColumns(): Promise<string[]>;
    private buildWhere;
    private loadIncludes;
    findUnique(args?: any): Promise<any>;
    findFirst(args?: any): Promise<any>;
    findMany(args?: any): Promise<any[]>;
    create(args?: any): Promise<any>;
    update(args?: any): Promise<any>;
    delete(args?: any): Promise<any>;
    upsert(args?: any): Promise<any>;
    count(args?: any): Promise<any>;
    updateMany(args?: any): Promise<{
        count: number | null;
    }>;
    deleteMany(args?: any): Promise<{
        count: number | null;
    }>;
}
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private pool;
    private dbConnected;
    user: PostgresModel;
    roleAssignment: PostgresModel;
    session: PostgresModel;
    refreshToken: PostgresModel;
    artistProfile: PostgresModel;
    event: PostgresModel;
    location: PostgresModel;
    ticketCategory: PostgresModel;
    eventRegistration: PostgresModel;
    eventTicket: PostgresModel;
    stageVerseSubmission: PostgresModel;
    vote: PostgresModel;
    judgeScore: PostgresModel;
    follow: PostgresModel;
    community: PostgresModel;
    communityMember: PostgresModel;
    post: PostgresModel;
    like: PostgresModel;
    comment: PostgresModel;
    message: PostgresModel;
    notification: PostgresModel;
    auditLog: PostgresModel;
    moderationReport: PostgresModel;
    checkInAuditLog: PostgresModel;
    leaderboardStanding: PostgresModel;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    isConnected(): boolean;
    $queryRaw(query: TemplateStringsArray, ...values: any[]): Promise<any[]>;
    $transaction(callback: (tx: any) => Promise<any>): Promise<any>;
}
