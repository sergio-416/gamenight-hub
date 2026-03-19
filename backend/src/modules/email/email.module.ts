import { EmailService } from "@modules/email/application/email.service";
import { ResendProvider } from "@modules/email/infrastructure/resend.provider";
import { Module } from "@nestjs/common";

@Module({
  providers: [ResendProvider, EmailService],
  exports: [EmailService],
})
export class EmailModule {}
