import { Module } from "@nestjs/common";
import { ExperimentsController } from "./experiments.controller";
import { ExperimentsRepository } from "./experiments.repository";
import { ExperimentsService } from "./experiments.service";

@Module({
  controllers: [ExperimentsController],
  providers: [ExperimentsService, ExperimentsRepository],
  exports: [ExperimentsService],
})
export class ExperimentsModule {}
