import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { sendVerificationEmail } from "~/lib/email";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
        email: z.string().email("올바른 이메일 주소를 입력해주세요"),
        password: z
          .string()
          .min(8, "비밀번호는 8자 이상이어야 합니다")
          .regex(
            /^(?=.*[a-zA-Z])(?=.*\d)/,
            "비밀번호는 영문과 숫자를 포함해야 합니다",
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "이미 등록된 이메일입니다",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
        },
      });

      // Create verification token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await ctx.db.verificationToken.create({
        data: {
          identifier: input.email,
          token,
          expires,
        },
      });

      await sendVerificationEmail(input.email, token);

      return { success: true, userId: user.id };
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const verificationToken = await ctx.db.verificationToken.findUnique({
        where: { token: input.token },
      });

      if (!verificationToken) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "유효하지 않은 인증 토큰입니다",
        });
      }

      if (verificationToken.expires < new Date()) {
        // Clean up expired token
        await ctx.db.verificationToken.delete({
          where: { token: input.token },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "인증 토큰이 만료되었습니다. 다시 요청해주세요.",
        });
      }

      // Update user emailVerified
      await ctx.db.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerified: new Date() },
      });

      // Delete used token
      await ctx.db.verificationToken.delete({
        where: { token: input.token },
      });

      return { success: true };
    }),

  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        // Don't reveal whether email exists
        return { success: true };
      }

      if (user.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "이미 인증된 이메일입니다",
        });
      }

      // Delete old tokens for this email
      await ctx.db.verificationToken.deleteMany({
        where: { identifier: input.email },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await ctx.db.verificationToken.create({
        data: {
          identifier: input.email,
          token,
          expires,
        },
      });

      await sendVerificationEmail(input.email, token);

      return { success: true };
    }),
});
