import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { categoryRouter } from "./routers/category";
import { tagRouter } from "./routers/tag";
import { tipRouter } from "./routers/tip";
import { commentRouter } from "./routers/comment";
import { likeRouter } from "./routers/like";
import { bookmarkRouter } from "./routers/bookmark";
import { projectRouter } from "./routers/project";

export const appRouter = createTRPCRouter({
  category: categoryRouter,
  tag: tagRouter,
  tip: tipRouter,
  comment: commentRouter,
  like: likeRouter,
  bookmark: bookmarkRouter,
  project: projectRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
