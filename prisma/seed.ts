import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { Currency, Lane, Rarity, Role } from "../src/generated/prisma/client";

// Dataset dari Drive modul berbentuk CSV sederhana (tanpa tanda kutip / koma di dalam field)
function readCsv(file: string): Record<string, string>[] {
  const text = fs.readFileSync(path.join(process.cwd(), "data", file), "utf8");
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const keys = header.split(",");
  return lines.map((line, i) => {
    const values = line.split(",");
    if (values.length !== keys.length) {
      throw new Error(`${file} baris ${i + 2}: jumlah kolom ${values.length}, seharusnya ${keys.length}`);
    }
    return Object.fromEntries(keys.map((k, j) => [k, values[j].trim()]));
  });
}

function toEnum<T extends Record<string, string>>(enumObj: T, value: string, label: string): T[keyof T] {
  const normalized = value.toUpperCase();
  if (!(normalized in enumObj)) {
    throw new Error(`Nilai ${label} tidak dikenal: "${value}"`);
  }
  return enumObj[normalized as keyof T];
}

// Kolom harga kosong → null (bukan 0)
function toNullableInt(value: string): number | null {
  return value === "" ? null : Number(value);
}

async function main() {
  await prisma.$executeRawUnsafe('TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE');

  // Urutan baris = id (Miya = 1 … Hirara = 133), jadi id dari file tidak ikut di-insert
  const heroes = readCsv("heroes.csv");
  await prisma.hero.createMany({
    data: heroes.map((h) => ({
      name: h.name,
      primaryRole: toEnum(Role, h.primaryRole, "primaryRole"),
primaryLane: toEnum(Lane, h.primaryLane, "primaryLane"),
secondaryRole: h.secondaryRole
  ? toEnum(Role, h.secondaryRole, "secondaryRole")
  : null,
secondaryLane: h.secondaryLane
  ? toEnum(Lane, h.secondaryLane, "secondaryLane")
  : null,
releaseDate: h.releaseDate || null,
note: h.note || null,
      releaseYear: Number(h.releaseYear),
      priceBP: toNullableInt(h.priceBP),
      priceDiamond: toNullableInt(h.priceDiamond),
    })),
  });

  const skins = readCsv("skins.csv");

await prisma.skin.createMany({
  data: skins.map((s) => ({
    name: s.name,
    heroId: Number(s.heroId),
    rarity: toEnum(Rarity, s.rarity, "rarity"),
    series: s.series || null,
    releaseDate: s.releaseDate || null,
    releaseYear: s.releaseYear ? Number(s.releaseYear) : null,
    priceDiamond: toNullableInt(s.priceDiamond),
    acquisition: s.acquisition || null,
  })),
});

  // TRUNCATE ... RESTART IDENTITY → urutan insert = id 1, 2, 3
  await prisma.player.createMany({
    data: [
      { nickname: "ArekITS", bp: 1500, diamond: 75 },
      { nickname: "SangPushRank", bp: 13000, diamond: 2892 },
      { nickname: "MageSurabaya", bp: 10000, diamond: 0 },
    ],
  });

  await prisma.playerHero.createMany({
    data: [
      { playerId: 1, heroId: 18, currency: Currency.BP, pricePaid: 2000 }, // Layla
      { playerId: 1, heroId: 1, currency: Currency.BP, pricePaid: 10800 }, // Miya
      { playerId: 2, heroId: 84, currency: Currency.DIAMOND, pricePaid: 599 }, // Ling
      { playerId: 2, heroId: 56, currency: Currency.BP, pricePaid: 32000 }, // Gusion
    ],
  });

  const [hero, skin, player, playerHero] = await Promise.all([
    prisma.hero.count(),
    prisma.skin.count(),
    prisma.player.count(),
    prisma.playerHero.count(),
  ]);
  console.log({ hero, skin, player, playerHero });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
