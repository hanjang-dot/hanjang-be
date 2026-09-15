import { Controller, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { McpService } from "./mcp.service";

@Controller("mcp")
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Post()
  async handle(@Req() req: Request, @Res() res: Response) {
    await this.mcpService.handleRequest(req, res);
  }
}
