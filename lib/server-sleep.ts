import "server-only";

export const sleepServer = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));