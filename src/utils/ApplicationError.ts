class ApplicationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ApplicationError";
  }
}

export { ApplicationError };