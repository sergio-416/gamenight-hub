import { FirebaseAuthGuard } from "@auth/infrastructure/guards/firebase-auth.guard.js";
import { CurrentUser } from "@common/decorators/current-user.decorator.js";
import type { FindEventsDto } from "./dto/event-filter.dto.js";
import { FindEventsSchema } from "./dto/event-filter.dto.js";
import { ParseUuidPipe } from "@common/pipes/parse-uuid.pipe.js";
import { ZodValidationPipe } from "@common/pipes/zod-validation.pipe.js";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
// biome-ignore lint/style/useImportType: DI token needed at runtime
import { EventsService } from "../application/events.service.js";
import type { CreateEventDto, UpdateEventDto } from "./dto/create-event.dto.js";
import {
  CreateEventSchema,
  UpdateEventSchema,
} from "./dto/create-event.dto.js";

@ApiTags("Events")
@Controller({ path: "events", version: "1" })
export class EventsController {
  constructor(
    @Inject(EventsService) private readonly eventsService: EventsService
  ) {}

  @ApiOperation({ summary: "Create a new game night event" })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(FirebaseAuthGuard)
  create(
    @Body(new ZodValidationPipe(CreateEventSchema)) dto: CreateEventDto,
    @CurrentUser("uid") uid: string
  ) {
    return this.eventsService.create(dto, uid);
  }

  @ApiOperation({ summary: "List all events" })
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(FindEventsSchema)) dto: FindEventsDto
  ) {
    const result = await this.eventsService.findAll(dto);
    return {
      ...result,
      data: result.data.map(({ createdBy: _, ...event }) => event),
    };
  }

  @ApiOperation({ summary: "Get an event by ID" })
  @Get(":id")
  async findOne(@Param("id", ParseUuidPipe) id: string) {
    const { createdBy: _, ...event } = await this.eventsService.findOne(id);
    return event;
  }

  @ApiOperation({ summary: "Update an event" })
  @Patch(":id")
  @UseGuards(FirebaseAuthGuard)
  update(
    @Param("id", ParseUuidPipe) id: string,
    @Body(new ZodValidationPipe(UpdateEventSchema)) dto: UpdateEventDto,
    @CurrentUser("uid") uid: string
  ) {
    return this.eventsService.update(id, dto, uid);
  }

  @ApiOperation({ summary: "Soft-delete an event" })
  @Delete(":id")
  @UseGuards(FirebaseAuthGuard)
  remove(
    @Param("id", ParseUuidPipe) id: string,
    @CurrentUser("uid") uid: string
  ) {
    return this.eventsService.remove(id, uid);
  }
}
