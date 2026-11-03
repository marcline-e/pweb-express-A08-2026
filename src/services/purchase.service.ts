import { prisma } from "../lib/prisma";
import { Prisma } from "../generated/prisma/client";
import { HttpError } from "../utils/HttpError";

const MAX_INT = 2_147_483_647; // batas kolom Int di PostgreSQL

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

// id di luar rentang Int tidak mungkin ada di DB → anggap tidak ditemukan, jangan sampai Prisma error 500
function isDbId(value: number): boolean {
  return value <= MAX_INT;
}

function parsePlayerId(param: string): number | null {
  if (!/^\d+$/.test(param)) return null;
  const id = Number(param);
  return id > 0 && isDbId(id) ? id : null;
}

export async function buyHero(playerIdParam: string, body: unknown) {
  const { heroId, currency } = (body ?? {}) as { heroId?: unknown; currency?: unknown };

  // #1 validasi body, sebelum query apa pun ke DB
  if (!isPositiveInt(heroId) || (currency !== "BP" && currency !== "DIAMOND")) {
    throw new HttpError(400, "heroId wajib diisi dan currency harus BP atau DIAMOND");
  }

  const playerId = parsePlayerId(playerIdParam);

  // Query independen jalan paralel; pengecekan tetap berurutan di bawah
  const [player, hero, owned] = await Promise.all([
    playerId !== null ? prisma.player.findUnique({ where: { id: playerId } }) : null,
    isDbId(heroId) ? prisma.hero.findUnique({ where: { id: heroId } }) : null,
    playerId !== null && isDbId(heroId)
      ? prisma.playerHero.findUnique({ where: { playerId_heroId: { playerId, heroId } } })
      : null,
  ]);

  // #2 player ada?
  if (!player) throw new HttpError(404, "Player tidak ditemukan");

  // #3 hero ada?
  if (!hero) throw new HttpError(404, "Hero tidak ditemukan");

  // #4 hero dijual dengan currency ini?
  const price = currency === "BP" ? hero.priceBP : hero.priceDiamond;
  if (price === null) {
    throw new HttpError(400, `Hero ${hero.name} tidak bisa dibeli dengan ${currency}`);
  }

  // #5 sudah punya?
  if (owned) throw new HttpError(409, "Player sudah memiliki hero ini");

  // #6 saldo cukup?
  const balance = currency === "BP" ? player.bp : player.diamond;
  if (balance < price) throw new HttpError(400, `Saldo ${currency} tidak cukup`);

  const balanceField = currency === "BP" ? "bp" : "diamond";

  try {
    // Potong saldo + catat kepemilikan: all-or-nothing
    const [updatedPlayer] = await prisma.$transaction([
      prisma.player.update({
        // syarat saldo >= harga ikut dicek di DB, jaga-jaga ada pembelian lain yang masuk bersamaan
        where: { id: player.id, [balanceField]: { gte: price } },
        data: { [balanceField]: { decrement: price } },
      }),
      prisma.playerHero.create({
        data: { playerId: player.id, heroId: hero.id, currency, pricePaid: price },
      }),
    ]);

    return {
      hero: { id: hero.id, name: hero.name },
      currency,
      pricePaid: price,
      balance: { bp: updatedPlayer.bp, diamond: updatedPlayer.diamond },
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // Dua request beli hero yang sama bersamaan → unique (playerId, heroId) bentrok
      if (err.code === "P2002") throw new HttpError(409, "Player sudah memiliki hero ini");
      // Saldo sudah terpakai request lain di antara pengecekan dan update
      if (err.code === "P2025") throw new HttpError(400, `Saldo ${currency} tidak cukup`);
    }
    throw err;
  }
}
