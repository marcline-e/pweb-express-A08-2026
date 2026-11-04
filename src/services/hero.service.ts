
import { prisma } from "../lib/prisma";
import { Prisma, Role, Lane } from "../generated/prisma/client";
import { HttpError } from "../utils/HttpError";

interface GetHeroesParams {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateHeroInput {
  name?: string;
  role?: string;
  lane?: string;
  releaseYear?: number;
  priceBP?: number | null;
  priceDiamond?: number | null;
}

const MAX_INT = 2_147_483_647;

export const heroService = {
  // GET /api/heroes
  async getAllHeroes(params: GetHeroesParams) {
    const role = params.role?.trim().toUpperCase();
    const search = params.search?.trim();

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(params.limit || 10, 100));

    const validRoles = Object.values(Role) as string[];

    if (role && !validRoles.includes(role)) {
      return {
        heroes: [],
        pagination: {
          page,
          limit,
          totalItems: 0,
          totalPages: 0,
        },
      };
    }

    const where: Prisma.HeroWhereInput = {
      ...(role ? { primaryRole: role as Role } : {}),
      ...(search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {}),
    };

    const [heroes, totalItems] = await Promise.all([
      prisma.hero.findMany({
        where,
        orderBy: { id: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.hero.count({ where }),
    ]);

    return {
      heroes,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  },

  // GET /api/heroes/:id
  async getHeroById(id: string) {
    const heroId = Number(id);

    if (
      !/^\d+$/.test(id) ||
      !Number.isSafeInteger(heroId) ||
      heroId <= 0 ||
      heroId > MAX_INT
    ) {
      throw new HttpError(404, "Hero tidak ditemukan");
    }

    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
      include: { skins: true },
    });

    if (!hero) {
      throw new HttpError(404, "Hero tidak ditemukan");
    }

    return hero;
  },

  // POST /api/heroes
  async createHero(input: CreateHeroInput) {
    if (
      !input.name ||
      !input.role ||
      !input.lane ||
      input.releaseYear === undefined ||
      input.releaseYear === null
    ) {
      throw new HttpError(400, "Data hero tidak lengkap");
    }

    if (typeof input.name !== "string" || !input.name.trim()) {
      throw new HttpError(400, "Nama hero tidak valid");
    }

    const role = input.role.trim().toUpperCase();
    const lane = input.lane.trim().toUpperCase();

    if (
      !Object.values(Role).includes(role as Role) ||
      !Object.values(Lane).includes(lane as Lane)
    ) {
      throw new HttpError(400, "Role atau lane tidak valid");
    }

    if (
      !Number.isInteger(input.releaseYear) ||
      input.releaseYear < 0
    ) {
      throw new HttpError(400, "Data angka tidak valid");
    }

    const prices = [input.priceBP, input.priceDiamond];

    for (const price of prices) {
      if (
        price !== undefined &&
        price !== null &&
        (!Number.isInteger(price) || price < 0)
      ) {
        throw new HttpError(400, "Data angka tidak valid");
      }
    }

    try {
      return await prisma.hero.create({
        data: {
          name: input.name.trim(),
          primaryRole: role as Role,
          primaryLane: lane as Lane,
          releaseYear: input.releaseYear,
          priceBP: input.priceBP ?? null,
          priceDiamond: input.priceDiamond ?? null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new HttpError(409, "Nama hero sudah digunakan");
      }

      throw error;
    }
  },
};
