import { DB_TOKEN } from "@database/database.module.js";
import { HttpService } from "@nestjs/axios";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Test, type TestingModule } from "@nestjs/testing";
import { buildMockDb, chainResolving } from "@test/db-mock.js";
import type { CreateLocationWithEventDto } from "../presentation/dto/create-location.dto.js";
import { LocationsService } from "./locations.service.js";

const OWNER_UID = "user-uid-123";
const OTHER_UID = "user-uid-456";

const makeLocation = (overrides = {}) => ({
  id: "507f1f77-bcf8-6cd7-9943-9011aaaabbbb",
  name: "Board Game Cafe Barcelona",
  latitude: 41.3851,
  longitude: 2.1734,
  address: "Carrer de la Princesa, 1",
  venueType: "cafe" as const,
  capacity: 20,
  amenities: ["WiFi", "Food"],
  description: null,
  hostName: null,
  createdBy: OWNER_UID,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("LocationsService", () => {
  let service: LocationsService;
  let mockDb: ReturnType<typeof buildMockDb>;

  const mockEventEmitter = { emit: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDb = buildMockDb({
      select: [makeLocation()],
      insert: [makeLocation()],
      update: [makeLocation()],
    });

    const mockHttpService = { get: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: DB_TOKEN, useValue: mockDb },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  describe("create location", () => {
    it("should persist new game night location to database", async () => {
      const createDto: CreateLocationWithEventDto = {
        name: "Board Game Cafe Barcelona",
        latitude: 41.3851,
        longitude: 2.1734,
        venueType: "cafe",
        capacity: 20,
      };

      const result = await service.create(createDto, OWNER_UID);

      expect(result.name).toBe("Board Game Cafe Barcelona");
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        "location.created",
        expect.anything()
      );
    });
  });

  describe("find all locations", () => {
    it("should return all persisted locations from database", async () => {
      const mockLocations = [
        makeLocation(),
        makeLocation({ id: "uuid-2", name: "Store" }),
      ];
      mockDb.select
        .mockReturnValueOnce(chainResolving(mockLocations))
        .mockReturnValueOnce(chainResolving([{ value: 2 }]));

      const result = await service.findAll();

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should return empty array when database has no locations", async () => {
      mockDb.select
        .mockReturnValueOnce(chainResolving([]))
        .mockReturnValueOnce(chainResolving([{ value: 0 }]));

      const result = await service.findAll();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("find one location", () => {
    it("should return location by id from database", async () => {
      const location = makeLocation();
      mockDb.select.mockReturnValue(chainResolving([location]));

      const result = await service.findOne(location.id);

      expect(result.id).toBe(location.id);
    });

    it("should throw NotFoundException when location id not found", async () => {
      mockDb.select.mockReturnValue(chainResolving([]));

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("update location", () => {
    it("should update location fields in database", async () => {
      const location = makeLocation();
      const updated = makeLocation({ name: "Updated Cafe", capacity: 25 });

      mockDb.select.mockReturnValue(chainResolving([location]));
      mockDb.update.mockReturnValue(chainResolving([updated]));

      const result = await service.update(
        location.id,
        { name: "Updated Cafe", capacity: 25 },
        OWNER_UID
      );

      expect(result.name).toBe("Updated Cafe");
    });

    it("should throw ForbiddenException when updating location owned by another user", async () => {
      const location = makeLocation({ createdBy: OTHER_UID });
      mockDb.select.mockReturnValue(chainResolving([location]));

      await expect(
        service.update(location.id, { name: "Hijacked" }, OWNER_UID)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("remove location", () => {
    it("should soft-delete location from database", async () => {
      const location = makeLocation();
      mockDb.select.mockReturnValue(chainResolving([location]));

      const result = await service.remove(location.id, OWNER_UID);

      expect(result.id).toBe(location.id);
      expect(mockDb.update).toHaveBeenCalledTimes(2);
    });

    it("should cascade soft-delete active events at the deleted location", async () => {
      const location = makeLocation();
      mockDb.select.mockReturnValue(chainResolving([location]));

      await service.remove(location.id, OWNER_UID);

      expect(mockDb.update).toHaveBeenCalledTimes(2);
    });

    it("should throw ForbiddenException when deleting location owned by another user", async () => {
      const location = makeLocation({ createdBy: OTHER_UID });
      mockDb.select.mockReturnValue(chainResolving([location]));

      await expect(service.remove(location.id, OWNER_UID)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe("find locations in bounds", () => {
    it("should return only locations within bounding box coordinates", async () => {
      const locationsInBounds = [
        makeLocation({ latitude: 41.38, longitude: 2.15 }),
        makeLocation({ id: "uuid-2", latitude: 41.4, longitude: 2.18 }),
      ];
      mockDb.select.mockReturnValue(chainResolving(locationsInBounds));

      const result = await service.findInBounds(41.3, 2.1, 41.5, 2.2);

      expect(result).toHaveLength(2);
    });

    it("should return empty array when no locations in specified bounds", async () => {
      mockDb.select.mockReturnValue(chainResolving([]));

      const result = await service.findInBounds(0, 0, 0.001, 0.001);

      expect(result).toEqual([]);
    });
  });
});
