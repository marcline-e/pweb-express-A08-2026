
import { prisma } from "../lib/prisma";

export async function getStatistics() {
  // Query independen berjalan paralel
  const [
    totalPlayers,
    totalHeroesOwned,
    diamondSum,
    topOwned,
    roleGroups,
  ] = await Promise.all([
    prisma.player.count(),

    prisma.playerHero.count(),

    prisma.player.aggregate({
      _sum: { diamond: true },
    }),

    prisma.playerHero.groupBy({
      by: ["heroId"],
      _count: { heroId: true },
      orderBy: [
        { _count: { heroId: "desc" } },
        { heroId: "asc" },
      ],
      take: 1,
    }),

    prisma.hero.groupBy({
      by: ["primaryRole"],
      _count: { primaryRole: true },
      orderBy: { primaryRole: "asc" },
    }),
  ]);

  let mostOwnedHero = null;

  if (topOwned.length > 0) {
    const { heroId, _count } = topOwned[0];

    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
      select: { name: true },
    });

    mostOwnedHero = {
      heroId,
      name: hero?.name ?? null,
      owners: _count.heroId,
    };
  }

  return {
    totalPlayers,
    totalHeroesOwned,
    totalDiamond: diamondSum._sum.diamond ?? 0,
    mostOwnedHero,
    heroesPerRole: roleGroups.map((g) => ({
      role: g.primaryRole,
      total: g._count.primaryRole,
    })),
  };
}
