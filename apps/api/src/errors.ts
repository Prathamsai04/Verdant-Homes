import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;
  const requestId = response.locals.requestId as string | undefined;
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Please check the highlighted information.",
        requestId,
        fieldErrors: error.flatten().fieldErrors,
      },
    });
    return;
  }
  if (error instanceof AppError) {
    response.status(error.status).json({ error: { code: error.code, message: error.message, requestId } });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "That record no longer exists.", requestId } });
    return;
  }
  response.log?.error({ err: error }, "Unhandled request error");
  response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong.", requestId } });
};
