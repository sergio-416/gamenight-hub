import { FirebaseAuthGuard } from "@auth/infrastructure/guards/firebase-auth.guard.js";
import { Test, type TestingModule } from "@nestjs/testing";
import { LocationsService } from "../application/locations.service.js";
import type {
  CreateLocationWithEventDto,
  UpdateLocationDto,
} from "./dto/create-location.dto.js";
import { LocationsController } from "./locations.controller.js";

const MOCK_UID = "user-uid-123";

describe("LocationsController", () => {
  let controller: LocationsController;

  const mockLocationsService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    findInBounds: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        { provide: LocationsService, useValue: mockLocationsService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LocationsController>(LocationsController);
  });

  describe("POST /locations", () => {
    it("should create a new game night location when valid data provided", async () => {
      const createDto: CreateLocationWithEventDto = {
        name: "Board Game Cafe Barcelona",
        latitude: 41.3851,
        longitude: 2.1734,
        venueType: "cafe",
        capacity: 20,
      };

      const expectedLocation = {
        id: "uuid-123",
        ...createDto,
        createdBy: MOCK_UID,
      };
      mockLocationsService.create.mockResolvedValue(expectedLocation);

      const result = await controller.create(createDto, MOCK_UID);

      expect(result.name).toBe("Board Game Cafe Barcelona");
      expect(mockLocationsService.create).toHaveBeenCalledWith(
        createDto,
        MOCK_UID
      );
    });
  });

  describe("GET /locations", () => {
    it("should return list of all game night locations without createdBy", async () => {
      const mockLocations = {
        data: [
          {
            id: "1",
            name: "Board Game Cafe",
            latitude: 41.3851,
            longitude: 2.1734,
            createdBy: "user-123",
          },
          {
            id: "2",
            name: "Game Store Central",
            latitude: 41.4,
            longitude: 2.18,
            createdBy: "user-456",
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      mockLocationsService.findAll.mockResolvedValue(mockLocations);

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      for (const location of result.data) {
        expect(location).not.toHaveProperty("createdBy");
      }
      expect(mockLocationsService.findAll).toHaveBeenCalledTimes(1);
    });

    it("should return empty data array when no locations exist", async () => {
      mockLocationsService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([]);
    });
  });

  describe("GET /locations/:id", () => {
    it("should return single location when valid id provided", async () => {
      const mockLocation = {
        id: "uuid-123",
        name: "Board Game Cafe",
        latitude: 41.3851,
        longitude: 2.1734,
      };
      mockLocationsService.findOne.mockResolvedValue(mockLocation);

      const result = await controller.findOne("uuid-123");

      expect(result.id).toBe("uuid-123");
      expect(mockLocationsService.findOne).toHaveBeenCalledWith("uuid-123");
    });
  });

  describe("PATCH /locations/:id", () => {
    it("should update location when valid data provided", async () => {
      const updateDto: UpdateLocationDto = {
        name: "Updated Cafe",
        capacity: 25,
      };
      const updatedLocation = {
        id: "uuid-123",
        name: "Updated Cafe",
        capacity: 25,
      };
      mockLocationsService.update.mockResolvedValue(updatedLocation);

      const result = await controller.update("uuid-123", updateDto, MOCK_UID);

      expect(result.name).toBe("Updated Cafe");
      expect(mockLocationsService.update).toHaveBeenCalledWith(
        "uuid-123",
        updateDto,
        MOCK_UID
      );
    });
  });

  describe("DELETE /locations/:id", () => {
    it("should remove location when valid id provided", async () => {
      const deletedLocation = { id: "uuid-123", name: "Closed Cafe" };
      mockLocationsService.remove.mockResolvedValue(deletedLocation);

      const result = await controller.remove("uuid-123", MOCK_UID);

      expect(result.id).toBe("uuid-123");
      expect(mockLocationsService.remove).toHaveBeenCalledWith(
        "uuid-123",
        MOCK_UID
      );
    });
  });

  describe("GET /locations/bounds", () => {
    it("should return locations within bounds without createdBy", async () => {
      const locationsInBounds = [
        {
          id: "1",
          name: "Cafe Inside",
          latitude: 41.38,
          longitude: 2.15,
          createdBy: "user-1",
        },
        {
          id: "2",
          name: "Store Inside",
          latitude: 41.4,
          longitude: 2.18,
          createdBy: "user-2",
        },
      ];
      mockLocationsService.findInBounds.mockResolvedValue(locationsInBounds);

      const result = await controller.findInBounds({
        swLat: 41.3,
        swLng: 2.1,
        neLat: 41.5,
        neLng: 2.2,
      });

      expect(result).toHaveLength(2);
      for (const location of result) {
        expect(location).not.toHaveProperty("createdBy");
      }
      expect(mockLocationsService.findInBounds).toHaveBeenCalledWith(
        41.3,
        2.1,
        41.5,
        2.2,
        []
      );
    });

    it("should filter by venue types when provided", async () => {
      mockLocationsService.findInBounds.mockResolvedValue([]);

      await controller.findInBounds({
        swLat: 41.3,
        swLng: 2.1,
        neLat: 41.5,
        neLng: 2.2,
        venueType: "cafe,store",
      });

      expect(mockLocationsService.findInBounds).toHaveBeenCalledWith(
        41.3,
        2.1,
        41.5,
        2.2,
        ["cafe", "store"]
      );
    });

    it("should return empty array when no locations in bounds", async () => {
      mockLocationsService.findInBounds.mockResolvedValue([]);

      const result = await controller.findInBounds({
        swLat: 0,
        swLng: 0,
        neLat: 0,
        neLng: 0,
      });

      expect(result).toEqual([]);
    });
  });
});
