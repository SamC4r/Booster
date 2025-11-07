import { db } from "@/db";
import { boostTransactions, userAssets, users, videos } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, sql, sum } from "drizzle-orm";
import z from "zod";

export const xpRouter = createTRPCRouter({

    getBoostByVideoId: baseProcedure
        .input(z.object({ videoId: z.string().uuid() }))
        .query(async ({ input }) => {
            const { videoId } = input;

            const [points] = await db
                .select({
                    boostPoints: users.boostPoints,
                })
                .from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .where(eq(videos.id, videoId))

            return points;

        }),

    getXpByUserId: baseProcedure
        .input(z.object({ userId: z.string().uuid() }))
        .query(async ({ input }) => {

            const { userId } = input;

            const [xp] = await db
                .select({
                    xp: sql<number>`coalesce(${users.xp}, 0)`.mapWith(Number),
                })
                .from(users)
                .where(eq(users.id, userId))

            return xp ?? { xp: 0 };
        }),

    buyById: protectedProcedure
        .input(
            z.object({
                // price is an integer number of XP points
                assetId: z.string().uuid(),
                price: z.number().int().nonnegative(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            const { price, assetId } = input;

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

            await db
                .insert(userAssets)
                .values({
                    assetId,
                    userId,
                })

            return updated;
        }),

    updateLevelChange: baseProcedure
        .input(z.object({ userId: z.string().uuid() }))
        .mutation(async ({ input }) => {

            const { userId } = input;

            const [updated] = await db
                .update(users)
                .set({
                    newLevelUpgrade: new Date(),
                })
                .where(eq(users.id, userId))
                .returning();

            return updated

        }),

    getBoostByUserId: baseProcedure
        .input(z.object({ userId: z.string().uuid() }))
        .query(async ({ input }) => {

            const { userId } = input;

            const [xp] = await db
                .select({
                    boostPoints: sql<number>`coalesce(${users.boostPoints}, 0)`.mapWith(Number),
                })
                .from(users)
                .where(eq(users.id, userId))

            return xp ?? { xp: 0 };
        }),
    buyBoostById: protectedProcedure
        .input(
            z.object({

                price: z.number().int().nonnegative(), //price is an integer number of xp points
                recipientId: z.string().uuid(), // beneficiario
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            const { price, recipientId } = input;

            // Atomic decrement with balance check in WHERE
            const [updated] = await db
                .update(users)
                .set({
                    xp: sql<number>`${users.xp} - ${price}`,
                })
                .where(and(eq(users.id, userId), gte(users.xp, price)))
                .returning({
                    // id: users.id,
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
                    id: users.id,
                    boostPoints: sql<number> `${users.boostPoints} + ${price}`
                })
                .where(eq(users.id, recipientId))
                .returning()

            if (!updatedBoostedChannel) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Insufficient XP or user not found.",
                });
            }


            //create transaction
            await db
                .insert(boostTransactions)
                .values({
                    boosterId: userId,
                    creatorId: recipientId,
                    xp: price,
                })
                .returning();




            //insert transaction in transactionsTable
            //insert item in owns of user

            return updatedBoostedChannel;
        }),

    getBoostersByCreatorId: baseProcedure
        .input(z.object({
            creatorId: z.string().uuid(),

        }))
        .query(async ({ input }) => {

            const { creatorId } = input;

            const boosters = await db
                .select({
                    user: {
                        id: users.id,
                        name: users.name,
                        imageUrl: users.imageUrl,
                        totalXpAdded: sum(boostTransactions.xp).as("total_xp"),
                    },
                })
                .from(boostTransactions)
                .where(eq(boostTransactions.creatorId, creatorId))
                .innerJoin(users, eq(users.id, boostTransactions.boosterId))
                .groupBy(users.id)
                .orderBy(desc(sum(boostTransactions.xp)))

            return boosters;
        }),

    rewardXp: protectedProcedure
        .input(z.object({
            amount: z.number(),
            videoId: z.string().uuid(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const { id: userId } = ctx.user;
                const { amount, videoId } = input;

                console.log(`Attempting to reward XP: User ${userId}, Amount ${amount}, Video ${videoId}`);

                // Update user XP (handle null XP values)
                const updateResult = await db.update(users)
                    .set({
                        xp: sql<number>`COALESCE(${users.xp}, 0) + ${amount}`,
                    })
                    .where(eq(users.id, userId))
                    .returning({ newXp: users.xp });

                if (!updateResult[0]) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to update user XP',
                    });
                }

                console.log(`XP reward granted successfully: User ${userId} received ${amount} XP for video ${videoId}. New XP: ${updateResult[0].newXp}`);
                return { 
                    success: true, 
                    xpAdded: amount, 
                    newTotal: updateResult[0].newXp 
                };
            } catch (error) {
                console.error('Error rewarding XP:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to reward XP',
                });
            }
        }),

    buyXp: protectedProcedure
        .input(z.object({
            priceLookupKey: z.enum([
                "xp_500",
                "xp_1200",
                "xp_2500",
                "xp_5500",
                "xp_10000",
                "xp_50000",
            ])
        }))
        .mutation(async ({ ctx, input }) => {
            const { user } = ctx;


            const prices = await stripe.prices.list({
                lookup_keys: [input.priceLookupKey],
                active: true,
                expand: ["data.product"],
                limit: 1,
            })

            const price = prices.data[0];
            if (!price) throw new TRPCError({ code: "BAD_REQUEST", message: "price not found" })

            const session = await stripe.checkout.sessions.create({
                mode: 'payment',
                payment_method_types: ['card'],
                line_items: [{ price: price.id, quantity: 1 }],
                success_url: `${process.env.NEXT_PUBLIC_VERCEL_URL}/market?status=success`,//`${process.env.VERCEL_URL ?? "http://localhost:3000"}/market?status=success`,
                cancel_url: `${process.env.NEXT_PUBLIC_VERCEL_URL}/market?status=cancel`,//`${process.env.VERCEL_URL} ?? "http://localhost:3000"}/market?status=cancel`,
                client_reference_id: user.id,
                metadata: { price_lookup_key: input.priceLookupKey },
            })


            return { url: session.url }


        })



})
