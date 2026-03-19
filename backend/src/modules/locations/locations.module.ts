import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { LocationsService } from "./application/locations.service.js";
import { LocationsController } from "./presentation/locations.controller.js";

@Module({
  imports: [
    HttpModule.register({
      headers: {
        "User-Agent": "GameNightHub/1.0 (https://github.com/gamenight-hub)",
        Accept: "application/json",
      },
      timeout: 8000,
    }),
    AuthModule,
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
