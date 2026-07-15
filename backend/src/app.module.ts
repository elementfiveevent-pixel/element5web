import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./common/redis/redis.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ArtistModule } from "./modules/artist/artist.module";
import { EventModule } from "./modules/event/event.module";
import { StageVerseModule } from "./modules/stageverse/stageverse.module";
import { LeaderboardModule } from "./modules/leaderboard/leaderboard.module";
import { SocialModule } from "./modules/social/social.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { MediaModule } from "./modules/media/media.module";
import { AdminModule } from "./modules/admin/admin.module";
import { StatsModule } from "./modules/stats/stats.module";

@Module({
  imports: [
    // Global Config Module loading env keys
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: [".env", "backend/.env"]
    }),
    
    // Core Databases Modules
    PrismaModule,
    RedisModule,

    // Feature Modules
    AuthModule,
    ArtistModule,
    EventModule,
    StageVerseModule,
    LeaderboardModule,
    SocialModule,
    NotificationModule,
    MediaModule,
    AdminModule,
    StatsModule,
  ],
})
export class AppModule {}
