import { Body, Controller, Post } from "@nestjs/common";
import { ExperimentsService } from "./experiments.service";

@Controller("experiments")
export class ExperimentsController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  @Post("events")
  track(@Body() input: unknown) {
    return this.experimentsService.trackEvent(input);
  }
}
