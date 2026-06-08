-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT '',
    "stockType1" TEXT NOT NULL DEFAULT '',
    "stockType2" TEXT NOT NULL DEFAULT '',
    "project" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "cost" REAL NOT NULL DEFAULT 0,
    "retailPrice" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "stockType1" TEXT NOT NULL DEFAULT '',
    "stockType2" TEXT NOT NULL DEFAULT '',
    "retailPrice" REAL NOT NULL DEFAULT 0,
    "cost" REAL NOT NULL DEFAULT 0,
    "initialStock" INTEGER NOT NULL DEFAULT 0,
    "displayStock" INTEGER NOT NULL DEFAULT 0,
    "stockIn" INTEGER NOT NULL DEFAULT 0,
    "stockOut" INTEGER NOT NULL DEFAULT 0,
    "damaged" INTEGER NOT NULL DEFAULT 0,
    "endingStock" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "userId" INTEGER,
    "type" TEXT NOT NULL,
    "warehouseId" INTEGER NOT NULL DEFAULT 1,
    "transactionCode" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "reason" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoryLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "action" TEXT NOT NULL,
    "productId" INTEGER,
    "userId" INTEGER,
    "productName" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "details" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoryLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HistoryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecipeItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recipeId" INTEGER NOT NULL,
    "componentId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "RecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeItem_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WastageSlip" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slipCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT NOT NULL DEFAULT '',
    "reportedBy" INTEGER,
    "approvedBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WastageSlip_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WastageSlip_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WastageSlipItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wastageSlipId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "WastageSlipItem_wastageSlipId_fkey" FOREIGN KEY ("wastageSlipId") REFERENCES "WastageSlip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WastageSlipItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stocktake" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT NOT NULL DEFAULT '',
    "createdBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stocktake_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StocktakeItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stocktakeId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "systemQuantity" INTEGER NOT NULL,
    "actualQuantity" INTEGER,
    "difference" INTEGER,
    "note" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "StocktakeItem_stocktakeId_fkey" FOREIGN KEY ("stocktakeId") REFERENCES "Stocktake" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StocktakeItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderCode" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_group_idx" ON "Product"("group");

-- CreateIndex
CREATE INDEX "Inventory_productId_idx" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_stockType1_idx" ON "Inventory"("stockType1");

-- CreateIndex
CREATE INDEX "Transaction_productId_idx" ON "Transaction"("productId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE INDEX "Transaction_warehouseId_idx" ON "Transaction"("warehouseId");

-- CreateIndex
CREATE INDEX "Transaction_source_idx" ON "Transaction"("source");

-- CreateIndex
CREATE INDEX "Transaction_transactionCode_idx" ON "Transaction"("transactionCode");

-- CreateIndex
CREATE INDEX "HistoryLog_productId_idx" ON "HistoryLog"("productId");

-- CreateIndex
CREATE INDEX "HistoryLog_action_idx" ON "HistoryLog"("action");

-- CreateIndex
CREATE INDEX "HistoryLog_createdAt_idx" ON "HistoryLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_productId_key" ON "Recipe"("productId");

-- CreateIndex
CREATE INDEX "RecipeItem_recipeId_idx" ON "RecipeItem"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeItem_componentId_idx" ON "RecipeItem"("componentId");

-- CreateIndex
CREATE UNIQUE INDEX "WastageSlip_slipCode_key" ON "WastageSlip"("slipCode");

-- CreateIndex
CREATE INDEX "WastageSlipItem_wastageSlipId_idx" ON "WastageSlipItem"("wastageSlipId");

-- CreateIndex
CREATE INDEX "WastageSlipItem_productId_idx" ON "WastageSlipItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Stocktake_code_key" ON "Stocktake"("code");

-- CreateIndex
CREATE INDEX "StocktakeItem_stocktakeId_idx" ON "StocktakeItem"("stocktakeId");

-- CreateIndex
CREATE INDEX "StocktakeItem_productId_idx" ON "StocktakeItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderCode_key" ON "Order"("orderCode");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
