import { createTRPCRouter } from "@/server/api/trpc";
import { groupRouter } from "./routers/group";
import { contactRouter } from "./routers/contact";
import { authRouter } from "./routers/auth";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  group: groupRouter,
  contact: contactRouter,
  auth: authRouter  
});

// export type definition of API
export type AppRouter = typeof appRouter;
