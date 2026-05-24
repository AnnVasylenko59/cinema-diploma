-- ==========================================
-- КРОК 1: СТВОРЕННЯ НОВИХ ТАБЛИЦЬ ПЕРЕКЛАДІВ
-- ==========================================

CREATE TABLE "MovieTranslation" (
                                    "id" SERIAL NOT NULL,
                                    "movieId" INTEGER NOT NULL,
                                    "language" TEXT NOT NULL,
                                    "title" TEXT NOT NULL,
                                    "description" TEXT NOT NULL,

                                    CONSTRAINT "MovieTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CityTranslation" (
                                   "id" SERIAL NOT NULL,
                                   "cityId" INTEGER NOT NULL,
                                   "language" TEXT NOT NULL,
                                   "name" TEXT NOT NULL,

                                   CONSTRAINT "CityTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TheaterTranslation" (
                                      "id" SERIAL NOT NULL,
                                      "theaterId" INTEGER NOT NULL,
                                      "language" TEXT NOT NULL,
                                      "name" TEXT NOT NULL,
                                      "address" TEXT,

                                      CONSTRAINT "TheaterTranslation_pkey" PRIMARY KEY ("id")
);

-- Створення унікальних індексів
CREATE UNIQUE INDEX "MovieTranslation_movieId_language_key" ON "MovieTranslation"("movieId", "language");
CREATE UNIQUE INDEX "CityTranslation_cityId_language_key" ON "CityTranslation"("cityId", "language");
CREATE UNIQUE INDEX "TheaterTranslation_theaterId_language_key" ON "TheaterTranslation"("theaterId", "language");

-- Додавання зовнішніх ключів (Foreign Keys)
ALTER TABLE "MovieTranslation" ADD CONSTRAINT "MovieTranslation_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CityTranslation" ADD CONSTRAINT "CityTranslation_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TheaterTranslation" ADD CONSTRAINT "TheaterTranslation_theaterId_fkey" FOREIGN KEY ("theaterId") REFERENCES "Theater" ("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ==========================================
-- КРОК 2: МІГРАЦІЯ ДАНИХ (БЕЗПЕЧНЕ КОПІЮВАННЯ)
-- ==========================================

-- Переносимо міста
INSERT INTO "CityTranslation" ("cityId", "language", "name")
SELECT "id", 'uk', "name" FROM "City";

INSERT INTO "CityTranslation" ("cityId", "language", "name")
SELECT "id", 'en', "name" FROM "City";

-- Переносимо кінотеатри
INSERT INTO "TheaterTranslation" ("theaterId", "language", "name", "address")
SELECT "id", 'uk', "name", "address" FROM "Theater";

INSERT INTO "TheaterTranslation" ("theaterId", "language", "name", "address")
SELECT "id", 'en', "name", "address" FROM "Theater";

-- Переносимо фільми
INSERT INTO "MovieTranslation" ("movieId", "language", "title", "description")
SELECT "id", 'uk', "title", "description" FROM "Movie";

INSERT INTO "MovieTranslation" ("movieId", "language", "title", "description")
SELECT "id", 'en', "title", "description" FROM "Movie";


-- ==========================================
-- КРОК 3: ОЧИЩЕННЯ СТАРИХ СТОВПЦІВ З ОСНОВНИХ ТАБЛИЦЬ
-- ==========================================

-- Видаляємо унікальний індекс назви міста, бо тепер назви будуть у таблиці перекладів
ALTER TABLE "City" DROP CONSTRAINT IF EXISTS "City_name_key";
DROP INDEX IF EXISTS "City_name_key";

-- Видаляємо старі текстові поля
ALTER TABLE "City" DROP COLUMN "name";
ALTER TABLE "Movie" DROP COLUMN "description", DROP COLUMN "title";
ALTER TABLE "Theater" DROP COLUMN "address", DROP COLUMN "name";