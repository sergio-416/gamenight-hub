import { PaginationSchema } from "@common/dto/pagination.dto.js";
import { EventTimeFilterSchema } from "@gamenight-hub/shared";
import { z } from "zod";

export const FindEventsSchema = z.object({
  ...PaginationSchema.shape,
  ...EventTimeFilterSchema.shape,
});
export type FindEventsDto = z.infer<typeof FindEventsSchema>;
