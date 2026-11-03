import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

const playerId = (value: string): number => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new HttpError(400, "player_id harus berupa bilangan bulat positif");
  return id;
};

const nicknameValue = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) throw new HttpError(400, "nickname wajib diisi");
  return value.trim();
};

export async function createPlayer(body: unknown) {
  const nickname = nicknameValue((body as { nickname?: unknown } | null)?.nickname);
  try {
    return await prisma.player.create({ data: { nickname, bp: 10000, diamond: 0 } });
  } catch (error: any) {
    if (error?.code === "P2002") throw new HttpError(409, "Nickname sudah digunakan");
    throw error;
  }
}

export async function getPlayer(idValue: string) {
  const player = await prisma.player.findUnique({
    where: { id: playerId(idValue) },
    select: { id: true, nickname: true, bp: true, diamond: true, playerHeroes: { include: { hero: true } } },
  });
  if (!player) throw new HttpError(404, "Player tidak ditemukan");
  return player;
}

export async function updatePlayer(idValue: string, body: unknown) {
  const id = playerId(idValue);
  const nickname = nicknameValue((body as { nickname?: unknown } | null)?.nickname);
  if (!(await prisma.player.findUnique({ where: { id }, select: { id: true } }))) throw new HttpError(404, "Player tidak ditemukan");
  try {
    return await prisma.player.update({ where: { id }, data: { nickname }, select: { id: true, nickname: true, bp: true, diamond: true } });
  } catch (error: any) {
    if (error?.code === "P2002") throw new HttpError(409, "Nickname sudah digunakan player lain");
    throw error;
  }
}

export async function deletePlayer(idValue: string) {
  const id = playerId(idValue);
  if (!(await prisma.player.findUnique({ where: { id }, select: { id: true } }))) throw new HttpError(404, "Player tidak ditemukan");
  await prisma.player.delete({ where: { id } });
  return { id };
}

export async function topUp(idValue: string, body: unknown) {
  const id = playerId(idValue);
  const amount = (body as { amount?: unknown } | null)?.amount;
  if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount <= 0) throw new HttpError(400, "amount harus berupa bilangan bulat lebih dari 0");
  if (!(await prisma.player.findUnique({ where: { id }, select: { id: true } }))) throw new HttpError(404, "Player tidak ditemukan");
  return prisma.player.update({ where: { id }, data: { diamond: { increment: amount } }, select: { id: true, nickname: true, diamond: true } });
}

export async function addMatchReward(idValue: string, body: unknown) {
  const id = playerId(idValue);
  const result = (body as { result?: unknown } | null)?.result;
  if (result !== "WIN" && result !== "LOSE") throw new HttpError(400, "result harus bernilai WIN atau LOSE");
  const reward = result === "WIN" ? 300 : 100;
  if (!(await prisma.player.findUnique({ where: { id }, select: { id: true } }))) throw new HttpError(404, "Player tidak ditemukan");
  const player = await prisma.player.update({ where: { id }, data: { bp: { increment: reward } }, select: { id: true, nickname: true, bp: true } });
  return { result, reward, player };
}
