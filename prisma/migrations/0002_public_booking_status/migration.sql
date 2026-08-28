ALTER TABLE "appointments"
ADD COLUMN "publicBookingTokenHash" VARCHAR(128);

CREATE UNIQUE INDEX "appointments_publicBookingTokenHash_key"
ON "appointments"("publicBookingTokenHash");
