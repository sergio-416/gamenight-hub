import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { NotificationsGateway } from "./gateway/notifications.gateway.js";

@Module({
  imports: [AuthModule],
  providers: [NotificationsGateway],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}
