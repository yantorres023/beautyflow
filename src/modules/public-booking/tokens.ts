import { createHash, randomBytes } from "node:crypto";

export function createPublicBookingToken() {
  return randomBytes(32).toString("hex");
}

export function hashPublicBookingToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
