-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "userAvatar" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "pushToken" TEXT,
    "phoneNumber" TEXT,
    "dialCode" TEXT,
    "isoCode" TEXT,
    "sms" BOOLEAN,
    "whatsapp" BOOLEAN,
    "telegram" BOOLEAN,
    "preferredCurrency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thing" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT,
    "category" TEXT,
    "ownerId" TEXT,
    "ownerImageUrl" TEXT,
    "imageUrl" TEXT,
    "price" DOUBLE PRECISION,
    "currencySymbol" TEXT,
    "country" TEXT,
    "city" TEXT,
    "status" TEXT,
    "start" TEXT,
    "end" TEXT,
    "priceRange" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "fromGoogle" BOOLEAN NOT NULL DEFAULT false,
    "googleData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Thing_latitude_longitude_idx" ON "Thing"("latitude", "longitude");

-- AddForeignKey
ALTER TABLE "Thing" ADD CONSTRAINT "Thing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
