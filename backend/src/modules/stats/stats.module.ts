import { AuthModule } from '@modules/auth/auth.module.js';
import { Module } from '@nestjs/common';
import { StatsService } from './application/stats.service.js';
import { StatsController } from './presentation/stats.controller.js';

@Module({
	imports: [AuthModule],
	controllers: [StatsController],
	providers: [StatsService],
})
export class StatsModule {}
