import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { categoryRouter } from "./routers/category";
import { tagRouter } from "./routers/tag";
import { tipRouter } from "./routers/tip";
import { commentRouter } from "./routers/comment";
import { likeRouter } from "./routers/like";
import { bookmarkRouter } from "./routers/bookmark";
import { projectRouter } from "./routers/project";
import { adminRouter } from "./routers/admin";
import { authRouter } from "./routers/auth";
import { userRouter } from "./routers/user";

export const appRouter = createTRPCRouter({
  category: categoryRouter,
  tag: tagRouter,
  tip: tipRouter,
  comment: commentRouter,
  like: likeRouter,
  bookmark: bookmarkRouter,
  project: projectRouter,
  admin: adminRouter,
  auth: authRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
