-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('ACTIVE', 'PENDING', 'BLOCKED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CONFIRMED', 'INVOICED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BOLETO', 'PIX', 'CREDIT_CARD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('lojista', 'representante', 'admin');

-- CreateTable: users
CREATE TABLE "users" (
    "id"        TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "password"  TEXT NOT NULL,
    "role"      "UserRole" NOT NULL DEFAULT 'lojista',
    "active"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: price_tables
CREATE TABLE "price_tables" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "discount"  DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable: representatives
CREATE TABLE "representatives" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "phone"     TEXT NOT NULL,
    "active"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId"    TEXT NOT NULL,

    CONSTRAINT "representatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable: stores
CREATE TABLE "stores" (
    "id"               TEXT NOT NULL,
    "cnpj"             TEXT NOT NULL,
    "razaoSocial"      TEXT NOT NULL,
    "nomeFantasia"     TEXT NOT NULL,
    "email"            TEXT NOT NULL,
    "phone"            TEXT NOT NULL,
    "address"          JSONB NOT NULL,
    "priceTableId"     TEXT NOT NULL,
    "representativeId" TEXT,
    "status"           "StoreStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    "userId"           TEXT NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable: products
CREATE TABLE "products" (
    "id"          TEXT NOT NULL,
    "sku"         TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "category"    TEXT NOT NULL,
    "images"      TEXT[] NOT NULL DEFAULT '{}',
    "unit"        TEXT NOT NULL,
    "unitQty"     INTEGER NOT NULL,
    "minOrder"    INTEGER NOT NULL DEFAULT 1,
    "weight"      DOUBLE PRECISION NOT NULL,
    "active"      BOOLEAN NOT NULL DEFAULT true,
    "blingId"     TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: product_prices
CREATE TABLE "product_prices" (
    "id"           TEXT NOT NULL,
    "productId"    TEXT NOT NULL,
    "priceTableId" TEXT NOT NULL,
    "price"        DOUBLE PRECISION NOT NULL,

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable: stocks
CREATE TABLE "stocks" (
    "id"        TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty"       INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: orders
CREATE TABLE "orders" (
    "id"               TEXT NOT NULL,
    "storeId"          TEXT NOT NULL,
    "representativeId" TEXT,
    "status"           "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal"         DOUBLE PRECISION NOT NULL,
    "freight"          DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount"         DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total"            DOUBLE PRECISION NOT NULL,
    "paymentMethod"    "PaymentMethod" NOT NULL,
    "paymentStatus"    "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate"          TIMESTAMP(3),
    "blingOrderId"     TEXT,
    "nfeKey"           TEXT,
    "pagbrasilId"      TEXT,
    "notes"            TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable: order_items
CREATE TABLE "order_items" (
    "id"        TEXT NOT NULL,
    "orderId"   TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty"       INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: refresh_tokens
CREATE TABLE "refresh_tokens" (
    "id"        TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable: notifications
CREATE TABLE "notifications" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "data"      JSONB,
    "read"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable: favorites
CREATE TABLE "favorites" (
    "id"        TEXT NOT NULL,
    "storeId"   TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable: audit_logs
CREATE TABLE "audit_logs" (
    "id"        TEXT NOT NULL,
    "orderId"   TEXT NOT NULL,
    "action"    TEXT NOT NULL,
    "details"   JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "representatives_email_key" ON "representatives"("email");

CREATE UNIQUE INDEX "representatives_userId_key" ON "representatives"("userId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "stores_cnpj_key" ON "stores"("cnpj");

CREATE UNIQUE INDEX "stores_userId_key" ON "stores"("userId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "product_prices_productId_priceTableId_key" ON "product_prices"("productId", "priceTableId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "stocks_productId_key" ON "stocks"("productId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "favorites_storeId_productId_key" ON "favorites"("storeId", "productId");

-- AddForeignKey: representatives -> users
ALTER TABLE "representatives" ADD CONSTRAINT "representatives_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: stores -> users
ALTER TABLE "stores" ADD CONSTRAINT "stores_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: stores -> price_tables
ALTER TABLE "stores" ADD CONSTRAINT "stores_priceTableId_fkey"
    FOREIGN KEY ("priceTableId") REFERENCES "price_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: stores -> representatives
ALTER TABLE "stores" ADD CONSTRAINT "stores_representativeId_fkey"
    FOREIGN KEY ("representativeId") REFERENCES "representatives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: product_prices -> products
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: product_prices -> price_tables
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_priceTableId_fkey"
    FOREIGN KEY ("priceTableId") REFERENCES "price_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: stocks -> products
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: orders -> stores
ALTER TABLE "orders" ADD CONSTRAINT "orders_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: order_items -> orders
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: order_items -> products
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: refresh_tokens -> users
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: notifications -> users
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: favorites -> stores
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: favorites -> products
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: audit_logs -> orders
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
