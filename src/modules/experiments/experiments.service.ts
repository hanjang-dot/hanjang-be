import { Injectable } from "@nestjs/common";
import { CustomBadRequestException } from "src/common/errors/custom-exceptions";
import { ExperimentErrorMessage } from "./experiments.error";
import { ExperimentsRepository } from "./experiments.repository";
import { experimentEventInputSchema } from "./experiments.types";

@Injectable()
export class ExperimentsService {
  constructor(private readonly experimentsRepository: ExperimentsRepository) {}

  trackEvent(input: unknown) {
    const parsed = experimentEventInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new CustomBadRequestException(ExperimentErrorMessage.InvalidEventPayload);
    }
    return this.experimentsRepository.insertEvent(parsed.data);
  }
}
