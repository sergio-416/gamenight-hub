import { CreateEventSchema, UpdateEventSchema } from "./create-event.dto";

const VALID_UUID_1 = "123e4567-e89b-12d3-a456-426614174000";
const VALID_UUID_2 = "123e4567-e89b-12d3-a456-426614174001";
const VALID_DATETIME = "2026-02-15T19:00:00Z";

describe("CreateEventSchema", () => {
  describe("when creating a valid event", () => {
    it("should accept valid event data with all required fields", () => {
      const result = CreateEventSchema.safeParse({
        title: "Catan Night at the Cafe",
        locationId: VALID_UUID_1,
        startTime: VALID_DATETIME,
        maxPlayers: 4,
      });

      expect(result.success).toBe(true);
    });

    it("should accept valid optional fields", () => {
      const result = CreateEventSchema.safeParse({
        title: "Game Night",
        gameId: VALID_UUID_2,
        locationId: VALID_UUID_1,
        startTime: VALID_DATETIME,
        endTime: "2026-02-15T23:00:00Z",
        maxPlayers: 6,
        description: "Bring your own snacks!",
        color: "violet",
      });

      expect(result.success).toBe(true);
    });

    it("should accept event without gameId (optional)", () => {
      const result = CreateEventSchema.safeParse({
        title: "Game Night",
        locationId: VALID_UUID_1,
        startTime: VALID_DATETIME,
        maxPlayers: 4,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("when validation fails", () => {
    it("should reject event without title", () => {
      const result = CreateEventSchema.safeParse({
        locationId: VALID_UUID_1,
        startTime: VALID_DATETIME,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("title"))).toBe(
          true
        );
      }
    });

    it("should reject event with empty title", () => {
      const result = CreateEventSchema.safeParse({
        title: "",
        locationId: VALID_UUID_1,
        startTime: VALID_DATETIME,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("title"))).toBe(
          true
        );
      }
    });

    it("should accept event without locationId when inline location is provided", () => {
      const result = CreateEventSchema.safeParse({
        title: "Game Night",
        startTime: VALID_DATETIME,
        maxPlayers: 4,
        location: {
          name: "The Board Room",
          latitude: 41.3851,
          longitude: 2.1734,
        },
      });

      expect(result.success).toBe(true);
    });

    it("should reject event without locationId or location", () => {
      const result = CreateEventSchema.safeParse({
        title: "Game Night",
        startTime: VALID_DATETIME,
        maxPlayers: 4,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes("location"))
        ).toBe(true);
      }
    });

    it("should reject event without startTime", () => {
      const result = CreateEventSchema.safeParse({
        title: "Game Night",
        locationId: VALID_UUID_1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes("startTime"))
        ).toBe(true);
      }
    });

    it("should reject maxPlayers greater than 100", () => {
      const result = CreateEventSchema.safeParse({
        title: "Game Night",
        locationId: VALID_UUID_1,
        startTime: VALID_DATETIME,
        maxPlayers: 101,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes("maxPlayers"))
        ).toBe(true);
      }
    });
  });
});

describe("UpdateEventSchema", () => {
  it("should accept an empty object (all fields optional)", () => {
    const result = UpdateEventSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept a partial update with only title", () => {
    const result = UpdateEventSchema.safeParse({ title: "New Title" });
    expect(result.success).toBe(true);
  });

  it("should reject empty title on update", () => {
    const result = UpdateEventSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});
