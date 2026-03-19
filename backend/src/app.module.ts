import { CacheModule } from "@common/cache/cache.module.js";
import { DatabaseModule } from "@database/database.module.js";
import { AuthModule } from "@modules/auth/auth.module.js";
import { EmailModule } from "@modules/email/email.module.js";
import { EventsModule } from "@modules/events/events.module.js";
import { GamesModule } from "@modules/games/games.module.js";
import { HealthModule } from "@modules/health/health.module.js";
import { LocationsModule } from "@modules/locations/locations.module.js";
import { NotificationsModule } from "@modules/notifications/notifications.module.js";
import { ParticipantsModule } from "@modules/participants/participants.module.js";
import { ProfileModule } from "@modules/profile/profile.module.js";
import { StatsModule } from "@modules/stats/stats.module.js";
import { XpModule } from "@modules/xp/xp.module.js";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ name: "default", ttl: 60000, limit: 100 }]),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: ".",
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    CacheModule,
    DatabaseModule,
    EmailModule,
    NotificationsModule,
    GamesModule,
    LocationsModule,
    EventsModule,
    ParticipantsModule,
    AuthModule,
    ProfileModule,
    StatsModule,
    XpModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
