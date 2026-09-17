import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { CallHandler, ExecutionContext } from "@nestjs/common";
import { of } from "rxjs";
import { TestHeadersInterceptor } from "./test-headers.interceptor";

const createContext = (headers: Record<string, string>) => {
  const socket = { destroy: jest.fn() };
  const req = { headers, socket };
  const context = {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
    }),
  } as unknown as ExecutionContext;
  return { context, socket };
};

const createNext = () => {
  const next = { handle: jest.fn(() => of("ok")) };
  return next as unknown as CallHandler & { handle: jest.Mock };
};

describe("TestHeadersInterceptor", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.useRealTimers();
  });

  it("헤더가 없으면 바로 다음으로 넘긴다", async () => {
    const { context } = createContext({});
    const next = createNext();
    await expect(new TestHeadersInterceptor().intercept(context, next)).resolves.toBeDefined();
    expect(next.handle).toHaveBeenCalledTimes(1);
  });

  it("X-Test-Delay는 지정 ms만큼 지연한다", async () => {
    jest.useFakeTimers();
    const { context } = createContext({ "x-test-delay": "500" });
    const next = createNext();
    const pending = new TestHeadersInterceptor().intercept(context, next);
    expect(next.handle).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(499);
    expect(next.handle).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    await pending;
    expect(next.handle).toHaveBeenCalledTimes(1);
  });

  it("X-Test-Drop은 소켓을 끊고 응답하지 않는다", async () => {
    const { context, socket } = createContext({ "x-test-drop": "true" });
    const next = createNext();
    const result = await new TestHeadersInterceptor().intercept(context, next);
    expect(socket.destroy).toHaveBeenCalledTimes(1);
    expect(next.handle).not.toHaveBeenCalled();
    const emitted: unknown[] = [];
    result.subscribe((value) => emitted.push(value));
    expect(emitted).toHaveLength(0);
  });

  it("X-Test-Drop에 ms가 있으면 지연 후 오류를 던진다", async () => {
    jest.useFakeTimers();
    const { context } = createContext({ "x-test-drop": "300" });
    const next = createNext();
    const pending = new TestHeadersInterceptor().intercept(context, next);
    pending.catch(() => undefined);
    await jest.advanceTimersByTimeAsync(300);
    await expect(pending).rejects.toMatchObject({ status: 503 });
    expect(next.handle).not.toHaveBeenCalled();
  });

  it("production에서는 헤더를 무시한다", async () => {
    process.env.NODE_ENV = "production";
    const { context, socket } = createContext({ "x-test-delay": "5000", "x-test-drop": "true" });
    const next = createNext();
    await new TestHeadersInterceptor().intercept(context, next);
    expect(next.handle).toHaveBeenCalledTimes(1);
    expect(socket.destroy).not.toHaveBeenCalled();
  });
});
