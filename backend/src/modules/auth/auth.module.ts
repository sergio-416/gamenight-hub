import { AuthService } from "@auth/application/auth.service";
import { FirebaseAdminProvider } from "@auth/infrastructure/firebase/firebase-admin.provider";
import { FirebaseAuthGuard } from "@auth/infrastructure/guards/firebase-auth.guard";
import { WebSocketAuthGuard } from "@auth/infrastructure/guards/websocket-auth.guard";
import { AuthController } from "@auth/presentation/auth.controller";
import { EmailModule } from "@modules/email/email.module.js";
import { Module } from "@nestjs/common";

@Module({
  imports: [EmailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    FirebaseAuthGuard,
    WebSocketAuthGuard,
    FirebaseAdminProvider,
  ],
  exports: [
    AuthService,
    FirebaseAuthGuard,
    WebSocketAuthGuard,
    FirebaseAdminProvider,
  ],
})
export class AuthModule {}
