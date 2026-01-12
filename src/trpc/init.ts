import { db } from '@/db';
import { users } from '@/db/schema';
import { auth, currentUser } from '@clerk/nextjs/server';
import { initTRPC, TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { cache } from 'react';
import superjson from 'superjson';
import { headers } from 'next/headers';

import { ratelimit, publicRateLimit } from '@/lib/ratelimit';

export const createTRPCContext = cache(async () => {
  /** NO DATABASE QUERIES HERE
   * @see: https://trpc.io/docs/server/context
   */

  const { userId } = await auth();
  const heads = await headers();
  const ip = heads.get("x-forwarded-for") ?? "127.0.0.1";

  return { clerkUserId: userId, ip };

  // return { userId: 'user_123' };
});

//hover on context -> potential clerkUserId: string | null
export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  const { success } = await publicRateLimit.limit(ctx.ip);
  if (!success) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  }
  return opts.next();
});


export const protectedProcedure = t.procedure.use(async function isAuthed(opts){
  //protect endpoint
  const {ctx} = opts;
  if(!ctx.clerkUserId){
    throw new TRPCError({code: "UNAUTHORIZED"});
  }

  let [user] = await db.select().from(users).where(eq(users.clerkId,ctx.clerkUserId)).limit(1);

  // console.log("protectedProcedure user:", user);

  if (!user) {
    // Fallback: Sync user from Clerk if not found in DB (e.g. webhook failed)
    try {
      const clerkUser = await currentUser();
      
      if (clerkUser && clerkUser.id === ctx.clerkUserId) {
          let name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
          if (!name) {
              if (clerkUser.username && clerkUser.username.trim()) {
                  name = clerkUser.username;
              } else {
                  name = `Anonymous ${Math.floor(Math.random() * 100000)}`;
              }
          }
          name = name.substring(0, 50);
          
          const [newUser] = await db.insert(users).values({
              clerkId: clerkUser.id,
              name: name,
              username: clerkUser.username,
              imageUrl: clerkUser.imageUrl,
          }).returning();
          
          user = newUser;
      }
    } catch (error) {
      console.error("Failed to sync user from Clerk in protectedProcedure fallback:", error);
      // Continue to throw UNAUTHORIZED below if user is still null
    }
  }

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const { success } = await ratelimit.limit(user.id);
  
  if (!success) {
    console.log("ratelimit exceeded for userId", user.id);
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "You are being rate limited." });
  }



  return opts.next({ctx: {
      ...ctx,
      user,
    },
  });

})

//Procedure ↗	API endpoint - can be a query, mutation, or subscription.