-- CreateTable
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Book" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'English',
    "shelfLocation" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "totalCopies" INTEGER NOT NULL DEFAULT 1,
    "availableCopies" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 复制旧数据
INSERT INTO "new_Book" ("id", "title", "author", "isbn", "genre", "description", "language", "shelfLocation", "available", "createdAt")
SELECT "id", "title", "author", "isbn", "genre", "description", "language", "shelfLocation", "available", "createdAt"
FROM "Book";

-- 删除旧表并重命名
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";

-- 重建索引
CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");

-- 根据旧的 available 字段修正 availableCopies（此处才是 UPDATE 的正确位置）
UPDATE "Book" SET "totalCopies" = 1, "availableCopies" = CASE WHEN "available" = 1 THEN 1 ELSE 0 END;

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;