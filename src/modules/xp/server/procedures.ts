import { db } from "@/db";
import { users } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, sql } from "drizzle-orm";
import z from "zod";

export const xpRouter = createTRPCRouter({
    getXpByUserId: baseProcedure
    .input(z.object({userId: z.string().uuid()}))
    .query( async ({ctx,input}) => {

        const {userId} = input;

        const [xp] = await db
        .select({
            xp: sql<number>`coalesce(${users.xp}, 0)`.mapWith(Number),       
        })
        .from(users)
        .where(eq(users.id,userId))
        
        return  xp ?? { xp: 0 };
    }),

     buyById: protectedProcedure
    .input(
      z.object({
        // price is an integer number of XP points
        price: z.number().int().nonnegative(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { price } = input;

      // Atomic decrement with balance check in WHERE
      const [updated] = await db
        .update(users)
        .set({
          xp: sql<number>`${users.xp} - ${price}`,
        })
        .where(and(eq(users.id, userId), gte(users.xp, price)))
        .returning({
          id: users.id,
          xp: users.xp,
        });

      if (!updated) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient XP or user not found.",
        });
      }


      //insert transaction in transactionsTable
      //insert item in owns of user

      return updated; 
    }),

    updateLevelChange: baseProcedure
    .input(z.object({userId: z.string().uuid()}))
    .mutation(async ({input}) => {

      const { userId } = input;

        const [updated] = await db
        .update(users)
        .set({
          newLevelUpgrade: new Date(),
        })
        .where(eq(users.id,userId))
        .returning();

        return updated
        
    }),
    
    getBoostByUserId: baseProcedure
    .input(z.object({userId: z.string().uuid()}))
    .query( async ({ctx,input}) => {

        const {userId} = input;

        const [xp] = await db
        .select({
            boostPoints: sql<number>`coalesce(${users.boostPoints}, 0)`.mapWith(Number),       
        })
        .from(users)
        .where(eq(users.id,userId))
        
        return  xp ?? { xp: 0 };
    }),
     buyBoostById: protectedProcedure
    .input(
      z.object({
        // price is an integer number of XP points
        price: z.number().int().nonnegative(),
        recipientId: z.string().uuid(), // beneficiario
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { price,recipientId } = input;

      // Atomic decrement with balance check in WHERE
      const [updated] = await db
        .update(users)
        .set({
          xp: sql<number>`${users.xp} - ${price}`,
        })
        .where(and(eq(users.id, userId), gte(users.xp, price)))
        .returning({
          id: users.id,
          xp: users.xp,
        });

      if (!updated) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient XP or user not found.",
        });
      }

      const [updatedBoostedChannel] = await db
      .update(users)
      .set({
        id:users.id,
        boostPoints: sql<number> `${users.boostPoints} + ${price}`
      })
      .where(eq(users.id,recipientId))
      .returning()

        if (!updatedBoostedChannel) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Insufficient XP or user not found.",
            });
        }




      //insert transaction in transactionsTable
      //insert item in owns of user

      return updatedBoostedChannel; 
    }),

})