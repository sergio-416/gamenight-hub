import { DB_TOKEN } from "@database/database.module.js";
import { Test, type TestingModule } from "@nestjs/testing";
import { buildMockDb } from "@test/db-mock.js";
import { BggCsvService } from "./bgg-csv.service";

describe("BggCsvService", () => {
  let service: BggCsvService;

  beforeAll(async () => {
    const mockDb = buildMockDb({ select: [{ count: 0 }], insert: [] });

    const module: TestingModule = await Test.createTestingModule({
      providers: [BggCsvService, { provide: DB_TOKEN, useValue: mockDb }],
    }).compile();

    await module.init();

    service = module.get<BggCsvService>(BggCsvService);
  });

  it("should load CSV data and build search index", () => {
    expect(service).toBeDefined();
    const results = service.search("Catan");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should return results matching GameSearchResult shape", () => {
    const results = service.search("Catan");

    expect(results.length).toBeGreaterThan(0);

    const first = results[0];
    expect(first).toHaveProperty("bggId");
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("source", "local");
    expect(typeof first.bggId).toBe("number");
    expect(typeof first.name).toBe("string");
  });

  it("should match case-insensitively", () => {
    const lower = service.search("catan");
    const upper = service.search("CATAN");
    const mixed = service.search("CaTaN");

    expect(lower.length).toBeGreaterThan(0);
    expect(upper.length).toBe(lower.length);
    expect(mixed.length).toBe(lower.length);
  });

  it("should handle fuzzy matching with typos", () => {
    const results = service.search("catna");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name.toLowerCase().includes("catan"))).toBe(
      true
    );
  }, 15_000);

  it("should match ignoring punctuation", () => {
    const results = service.search("ticket ride");

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name.toLowerCase().includes("ticket"))).toBe(
      true
    );
  }, 15_000);

  it("should match ignoring articles", () => {
    const results = service.search("castles burgundy");

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name.toLowerCase().includes("castles"))).toBe(
      true
    );
  }, 15_000);

  it("should handle multi-word tokenised search", () => {
    const results = service.search("ticket ride europe");

    expect(results.length).toBeGreaterThan(0);
  }, 15_000);

  it("should match compound words written without spaces", () => {
    const results = service.search("ticketride");

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name.toLowerCase().includes("ticket"))).toBe(
      true
    );
  }, 15_000);

  it("should match joined game names written with spaces", () => {
    const results = service.search("Micro Macro");

    expect(results.length).toBeGreaterThan(0);
    expect(
      results.some((r) => r.name.toLowerCase().includes("micromacro"))
    ).toBe(true);
  }, 15_000);

  it("should limit results to maxSearchResults", () => {
    const results = service.search("game");

    expect(results.length).toBeLessThanOrEqual(50);
  });

  it("should return empty array for gibberish", () => {
    const results = service.search("zzzqqq99999xyzabc");

    expect(results).toEqual([]);
  });

  it("should return empty array for empty/whitespace query", () => {
    expect(service.search("")).toEqual([]);
    expect(service.search("   ")).toEqual([]);
  });

  it("should boost ranked games above unranked", () => {
    const results = service.search("catan");

    if (results.length < 2) return;

    const firstRanked = results.findIndex(
      (r) => r.rank !== undefined && r.rank !== "Not Ranked"
    );
    const firstUnranked = results.findIndex((r) => r.rank === undefined);

    if (firstRanked >= 0 && firstUnranked >= 0) {
      expect(firstRanked).toBeLessThan(firstUnranked);
    }
  });
});
