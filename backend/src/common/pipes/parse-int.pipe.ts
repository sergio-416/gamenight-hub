import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from "@nestjs/common";
import { z } from "zod";
import { ERROR_CODE } from "../error-codes";

const PositiveIntSchema = z.coerce.number().int().positive();

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const result = PositiveIntSchema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: ERROR_CODE.INVALID_INTEGER,
        message: "Invalid integer parameter",
      });
    }
    return result.data;
  }
}
