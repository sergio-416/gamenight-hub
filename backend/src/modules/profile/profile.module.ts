import { AuthModule } from '@modules/auth/auth.module.js';
import { GamesModule } from '@modules/games/games.module.js';
import { XpModule } from '@modules/xp/xp.module.js';
import { Module } from '@nestjs/common';
import { ProfileService } from './application/profile.service.js';
import { ProfileController } from './presentation/profile.controller.js';

@Module({
	imports: [AuthModule, GamesModule, XpModule],
	controllers: [ProfileController],
	providers: [ProfileService],
	exports: [ProfileService],
})
export class ProfileModule {}
