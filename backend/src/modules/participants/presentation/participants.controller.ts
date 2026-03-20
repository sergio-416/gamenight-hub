import { FirebaseAuthGuard } from '@auth/infrastructure/guards/firebase-auth.guard.js';
import { CurrentUser } from '@common/decorators/current-user.decorator.js';
import { ParseUuidPipe } from '@common/pipes/parse-uuid.pipe.js';
import {
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Post,
	UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParticipantsService } from '../application/participants.service.js';

@ApiTags('Participants')
@Controller({ path: 'events', version: '1' })
export class ParticipantsController {
	readonly #participantsService: ParticipantsService;

	constructor(@Inject(ParticipantsService) participantsService: ParticipantsService) {
		this.#participantsService = participantsService;
	}

	@ApiOperation({ summary: 'Join an event' })
	@Post(':eventId/join')
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(FirebaseAuthGuard)
	join(@Param('eventId', ParseUuidPipe) eventId: string, @CurrentUser('uid') uid: string) {
		return this.#participantsService.join(eventId, uid);
	}

	@ApiOperation({ summary: 'Leave an event' })
	@Delete(':eventId/join')
	@UseGuards(FirebaseAuthGuard)
	leave(@Param('eventId', ParseUuidPipe) eventId: string, @CurrentUser('uid') uid: string) {
		return this.#participantsService.leave(eventId, uid);
	}

	@ApiOperation({ summary: 'List participants of an event' })
	@Get(':eventId/participants')
	findByEvent(@Param('eventId', ParseUuidPipe) eventId: string) {
		return this.#participantsService.findByEvent(eventId);
	}
}
