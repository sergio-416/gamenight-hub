import { BadRequestException } from "@nestjs/common";
import { ParseIntPipe } from "./parse-int.pipe";

describe("ParseIntPipe", () => {
  const pipe = new ParseIntPipe();

  it("should accept a valid positive integer string", () => {
    expect(pipe.transform("42")).toBe(42);
  });

  it('should accept "1" as the smallest positive integer', () => {
    expect(pipe.transform("1")).toBe(1);
  });

  it("should reject zero", () => {
    expect(() => pipe.transform("0")).toThrow(BadRequestException);
  });

  it("should reject negative numbers", () => {
    expect(() => pipe.transform("-5")).toThrow(BadRequestException);
  });

  it("should reject non-numeric strings", () => {
    expect(() => pipe.transform("abc")).toThrow(BadRequestException);
  });

  it("should reject decimal numbers", () => {
    expect(() => pipe.transform("3.14")).toThrow(BadRequestException);
  });
});
