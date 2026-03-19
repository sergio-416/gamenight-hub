import {
  CreateLocationSchema,
  CreateLocationWithEventSchema,
  UpdateLocationSchema,
} from "./create-location.dto";

describe("CreateLocationSchema", () => {
  describe("when creating a valid location", () => {
    it("should accept valid location data with all required fields", () => {
      const result = CreateLocationSchema.safeParse({
        name: "Board Game Cafe Barcelona",
        latitude: 41.3851,
        longitude: 2.1734,
      });

      expect(result.success).toBe(true);
    });

    it("should accept valid optional fields", () => {
      const result = CreateLocationSchema.safeParse({
        name: "Game Store Central",
        latitude: 41.4,
        longitude: 2.18,
        address: "Main Street 123",
        venueType: "store",
        capacity: 50,
        amenities: ["WiFi", "Food", "Drinks", "Parking"],
        description: "Best board game store in town!",
        hostName: "John Doe",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("when validation fails", () => {
    it("should reject location without name", () => {
      const result = CreateLocationSchema.safeParse({
        latitude: 41.3851,
        longitude: 2.1734,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("name"))).toBe(
          true
        );
      }
    });

    it("should reject location without latitude", () => {
      const result = CreateLocationSchema.safeParse({
        name: "Test Cafe",
        longitude: 2.1734,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes("latitude"))
        ).toBe(true);
      }
    });

    it("should reject location without longitude", () => {
      const result = CreateLocationSchema.safeParse({
        name: "Test Cafe",
        latitude: 41.3851,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes("longitude"))
        ).toBe(true);
      }
    });

    it("should reject location with latitude out of range", () => {
      const result = CreateLocationSchema.safeParse({
        name: "Invalid Location",
        latitude: 100,
        longitude: 2.1734,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes("latitude"))
        ).toBe(true);
      }
    });

    it("should reject location with longitude out of range", () => {
      const result = CreateLocationSchema.safeParse({
        name: "Invalid Location",
        latitude: 41.3851,
        longitude: 200,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes("longitude"))
        ).toBe(true);
      }
    });

    it("should reject location with invalid venueType", () => {
      const result = CreateLocationSchema.safeParse({
        name: "Test Location",
        latitude: 41.3851,
        longitude: 2.1734,
        venueType: "invalid_type",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes("venueType"))
        ).toBe(true);
      }
    });

    it("should reject location with capacity less than 1", () => {
      const result = CreateLocationSchema.safeParse({
        name: "Test Location",
        latitude: 41.3851,
        longitude: 2.1734,
        capacity: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes("capacity"))
        ).toBe(true);
      }
    });
  });
});

describe("CreateLocationWithEventSchema", () => {
  it("should accept valid location data with an eventDate", () => {
    const result = CreateLocationWithEventSchema.safeParse({
      name: "Board Game Cafe",
      latitude: 41.3851,
      longitude: 2.1734,
      eventDate: "2025-12-01T19:00:00.000Z",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.eventDate).toBe("2025-12-01T19:00:00.000Z");
    }
  });

  it("should accept valid location data without an eventDate", () => {
    const result = CreateLocationWithEventSchema.safeParse({
      name: "Board Game Cafe",
      latitude: 41.3851,
      longitude: 2.1734,
    });

    expect(result.success).toBe(true);
  });

  it("should not carry eventDate on the base CreateLocationSchema", () => {
    const result = CreateLocationSchema.safeParse({
      name: "Board Game Cafe",
      latitude: 41.3851,
      longitude: 2.1734,
      eventDate: "2025-12-01T19:00:00.000Z",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).eventDate
      ).toBeUndefined();
    }
  });
});

describe("UpdateLocationSchema", () => {
  it("should accept an empty object (all fields optional)", () => {
    const result = UpdateLocationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept a partial update with only name", () => {
    const result = UpdateLocationSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("should reject empty name on update", () => {
    const result = UpdateLocationSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});
