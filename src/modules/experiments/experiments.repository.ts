import { Inject, Injectable } from "@nestjs/common";
import { Database, DRIZZLE } from "src/modules/database/database.module";
import { experimentEvents, type ExperimentEvent } from "src/modules/database/schema";

import type { ExperimentEventInput } from "./experiments.types";

@Injectable()
export class ExperimentsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async insertEvent(input: ExperimentEventInput): Promise<ExperimentEvent> {
    const [event] = await this.db.insert(experimentEvents).values(input).returning();
    return event;
  }
}
