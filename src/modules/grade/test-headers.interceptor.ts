import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Request } from "express";
import { Observable } from "rxjs";
import { CustomServiceUnavailableException } from "src/common/errors/custom-exceptions";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseMs = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  const ms = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
};

@Injectable()
export class TestHeadersInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    if (process.env.NODE_ENV === "production") {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest<Request>();
    const drop = req.headers["x-test-drop"];
    if (drop !== undefined) {
      const ms = parseMs(drop);
      if (ms > 0) {
        await sleep(ms);
        throw new CustomServiceUnavailableException("x-test-drop");
      }
      req.socket.destroy();
      return new Observable(() => () => undefined);
    }
    const delayMs = parseMs(req.headers["x-test-delay"]);
    if (delayMs > 0) {
      await sleep(delayMs);
    }
    return next.handle();
  }
}
