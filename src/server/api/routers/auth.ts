import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { generateUniqueNickname } from "~/lib/nickname-generator";

const DEFAULT_AVATAR_SEEDS = [
  "Felix", "Aneka", "Milo", "Sasha", "Luna", "Orion", "Pepper", "Zoe",
];

function getRandomAvatarUrl(): string {
  const seed = DEFAULT_AVATAR_SEEDS[Math.floor(Math.random() * DEFAULT_AVATAR_SEEDS.length)]!;
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;
}

export const authRouter = createTRPCRouter({
  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      return { available: !existing };
    }),

  checkNickname: publicProcedure
    .input(z.object({ nickname: z.string().min(2).max(20) }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { nickname: input.nickname },
        select: { id: true },
      });
      return { available: !existing };
    }),

  syncUser: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { id: input.id },
      });
      if (existing) {
        return { success: true, userId: existing.id };
      }

      const nickname = await generateUniqueNickname(async (name) => {
        const found = await ctx.db.user.findUnique({
          where: { nickname: name },
          select: { id: true },
        });
        return !found;
      });

      const user = await ctx.db.user.create({
        data: {
          id: input.id,
          email: input.email,
          nickname,
          image: getRandomAvatarUrl(),
        },
      });
      return { success: true, userId: user.id };
    }),
});
