import { z } from "zod";
import bcrypt from "bcryptjs";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다" });
    }

    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(2, "닉네임은 2자 이상이어야 합니다")
          .max(20, "닉네임은 20자 이하여야 합니다")
          .transform((v) => v.trim())
          .optional(),
        image: z.string().url("올바른 URL이어야 합니다").optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data: Record<string, string> = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.image !== undefined) data.image = input.image;

      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data,
        select: { id: true, name: true, email: true, image: true },
      });

      return user;
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요"),
        newPassword: z
          .string()
          .min(8, "비밀번호는 8자 이상이어야 합니다")
          .regex(
            /^(?=.*[a-zA-Z])(?=.*\d)/,
            "비밀번호는 영문과 숫자를 포함해야 합니다",
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { password: true },
      });

      if (!user?.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "비밀번호가 설정되지 않은 계정입니다",
        });
      }

      const isValid = await bcrypt.compare(input.currentPassword, user.password);
      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "현재 비밀번호가 일치하지 않습니다",
        });
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 12);

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { password: hashedPassword },
      });

      return { success: true };
    }),
});
