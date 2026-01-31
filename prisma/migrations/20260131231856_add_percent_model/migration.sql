-- CreateTable
CREATE TABLE "PercentModel" (
    "id" SERIAL NOT NULL,
    "weights" JSONB NOT NULL,
    "bias" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "samples" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PercentModel_pkey" PRIMARY KEY ("id")
);
