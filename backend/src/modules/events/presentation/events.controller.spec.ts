import { FirebaseAuthGuard } from "@auth/infrastructure/guards/firebase-auth.guard.js";
import { Test, type TestingModule } from "@nestjs/testing";
import { EventsService } from "../application/events.service.js";
import type { CreateEventDto, UpdateEventDto } from "./dto/create-event.dto.js";
import { EventsController } from "./events.controller.js";

const MOCK_UID = "user-uid-123";

describe("EventsController", () => {
  let controller: EventsController;

  const mockEventsService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: mockEventsService }],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EventsController>(EventsController);
  });

  describe("POST /events", () => {
    it("should create a new game night event when valid data provided", async () => {
      const createDto: CreateEventDto = {
        title: "Catan Night at the Cafe",
        gameId: "507f1f77-bcf8-6cd7-9943-9011aaaabbbb",
        locationId: "507f1f77-bcf8-6cd7-9943-9022aaaabbbb",
        startTime: "2026-02-15T19:00:00Z",
        maxPlayers: 4,
      };

      const expectedEvent = {
        id: "uuid-123",
        ...createDto,
        createdBy: MOCK_UID,
      };
      mockEventsService.create.mockResolvedValue(expectedEvent);

      const result = await controller.create(createDto, MOCK_UID);

      expect(result.title).toBe("Catan Night at the Cafe");
      expect(mockEventsService.create).toHaveBeenCalledWith(
        createDto,
        MOCK_UID
      );
    });
  });

  describe("GET /events", () => {
    it("should return list of all game night events", async () => {
      const mockEvents = [
        {
          id: "1",
          title: "Catan Night",
          locationId: "loc-1",
          startTime: new Date(),
          createdBy: "uid-1",
        },
        {
          id: "2",
          title: "Ticket Night",
          locationId: "loc-1",
          startTime: new Date(),
          createdBy: "uid-2",
        },
      ];
      mockEventsService.findAll.mockResolvedValue({
        data: mockEvents,
        total: 2,
      });

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).not.toHaveProperty("createdBy");
      expect(mockEventsService.findAll).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no events exist", async () => {
      mockEventsService.findAll.mockResolvedValue({ data: [], total: 0 });

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([]);
    });
  });

  describe("GET /events/:id", () => {
    it("should return single event when valid id provided", async () => {
      const mockEvent = {
        id: "uuid-123",
        title: "Catan Night",
        locationId: "loc-1",
        startTime: new Date(),
      };
      mockEventsService.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOne("uuid-123");

      expect(result.id).toBe("uuid-123");
      expect(mockEventsService.findOne).toHaveBeenCalledWith("uuid-123");
    });
  });

  describe("PATCH /events/:id", () => {
    it("should update event when valid data provided", async () => {
      const updateDto: UpdateEventDto = {
        title: "Updated Catan Night",
        maxPlayers: 6,
      };
      const updatedEvent = {
        id: "uuid-123",
        title: "Updated Catan Night",
        maxPlayers: 6,
      };
      mockEventsService.update.mockResolvedValue(updatedEvent);

      const result = await controller.update("uuid-123", updateDto, MOCK_UID);

      expect(result.title).toBe("Updated Catan Night");
      expect(mockEventsService.update).toHaveBeenCalledWith(
        "uuid-123",
        updateDto,
        MOCK_UID
      );
    });
  });

  describe("DELETE /events/:id", () => {
    it("should remove event when valid id provided", async () => {
      const deletedEvent = { id: "uuid-123", title: "Deleted Event" };
      mockEventsService.remove.mockResolvedValue(deletedEvent);

      const result = await controller.remove("uuid-123", MOCK_UID);

      expect(result.id).toBe("uuid-123");
      expect(mockEventsService.remove).toHaveBeenCalledWith(
        "uuid-123",
        MOCK_UID
      );
    });
  });
});
