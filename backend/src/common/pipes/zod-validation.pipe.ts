import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";
import { ERROR_CODE } from "../error-codes";

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: ERROR_CODE.VALIDATION_FAILED,
        message: "Validation failed",
        issues: result.error.issues,
      });
    }
    return result.data;
  }
}
