
import { prisma } from "../lib/prisma";
import { Prisma, Rarity } from "../generated/prisma/client";
import { HttpError } from "../utils/HttpError";

interface GetSkinsParams {
  heroId?: string;
  rarity?: string;
  page?: number;
  limit?: number;
}

const MAX_INT = 2_147_483_647;

export const skinService = {
  // GET /api/skins
  async getAllSkins(params: GetSkinsParams) {
    const heroIdParam = params.heroId?.trim();
    const rarity = params.rarity?.trim().toUpperCase();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(params.limit || 10, 100));

    let heroId: number | undefined;

    if (heroIdParam) {
      const parsedId = Number(heroIdParam);

      if (
        !/^\d+$/.test(heroIdParam) ||
        !Number.isSafeInteger(parsedId) ||
        parsedId <= 0 ||
        parsedId > MAX_INT
      ) {
        return {
          skins: [],
          pagination: {
            page,
            limit,
            totalItems: 0,
            totalPages: 0,
          },
        };
      }

      heroId = parsedId;
    }

    const validRarities = Object.values(Rarity) as string[];

    if (rarity && !validRarities.includes(rarity)) {
      return {
        skins: [],
        pagination: {
          page,
          limit,
          totalItems: 0,
          totalPages: 0,
        },
      };
    }

    const where: Prisma.SkinWhereInput = {
      ...(heroId !== undefined ? { heroId } : {}),
      ...(rarity ? { rarity: rarity as Rarity } : {}),
    };

    const [skins, totalItems] = await Promise.all([
      prisma.skin.findMany({
        where,
        orderBy: { id: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.skin.count({ where }),
    ]);

    return {
      skins,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  },

  // GET /api/skins/:id
  async getSkinById(id: string) {
    const skinId = Number(id);

    if (
      !/^\d+$/.test(id) ||
      !Number.isSafeInteger(skinId) ||
      skinId <= 0 ||
      skinId > MAX_INT
    ) {
      throw new HttpError(404, "Skin tidak ditemukan");
    }

    const skin = await prisma.skin.findUnique({
      where: { id: skinId },
    });

    if (!skin) {
      throw new HttpError(404, "Skin tidak ditemukan");
    }

    return skin;
  },
};
