import { db } from "@/db";
import { boostTransactions, notifications, userAssets, users, videos, bonusClaims, userFollows } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, sql, sum, count } from "drizzle-orm";
import z from "zod";

export const xpRouter = createTRPCRouter({

    getTopRanked: baseProcedure
        .input(z.object({
            limit: z.number().min(1).max(100).default(50),
        }))
        .query(async ({ input }) => {
            const { limit } = input;


            const topUsers = await db
                .select({
                    id: users.id,
                    name: users.name,
                    username: users.username,
                    imageUrl: users.imageUrl,
                    boostPoints: users.boostPoints,
                    followers: count(userFollows.userId),
                })
                .from(users)
                .leftJoin(userFollows, eq(users.id, userFollows.creatorId))
                .groupBy(users.id)
                .orderBy(desc(users.boostPoints))
                .limit(limit);

            return topUsers;
        }),

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

    getWelcomeBonusStatus: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.user.id;

            if (ctx.user.accountType !== 'personal') {
                return { canClaim: false, claimed: false, message: "Only personal accounts are eligible" };
            }

            // Check if user has already claimed any welcome bonus
            const [existingClaim] = await db
                .select()
                .from(bonusClaims)
                .where(and(
                    eq(bonusClaims.userId, userId),
                    sql`${bonusClaims.bonusType} IN ('welcome_2000', 'welcome_500')`
                ));

            if (existingClaim) {
                return { canClaim: false, claimed: true };
            }

            // Check availability for 2000 XP bonus
            const [claims2000] = await db
                .select({ count: count() })
                .from(bonusClaims)
                .where(eq(bonusClaims.bonusType, 'welcome_2000'));
            
            const count2000 = claims2000?.count ?? 0;

            if (count2000 < 100) {
                return { 
                    canClaim: true, 
                    claimed: false, 
                    amount: 2000, 
                    remaining: 100 - count2000,
                    type: 'welcome_2000' as const
                };
            }

            // Check availability for 500 XP bonus
            const [claims500] = await db
                .select({ count: count() })
                .from(bonusClaims)
                .where(eq(bonusClaims.bonusType, 'welcome_500'));
            
            const count500 = claims500?.count ?? 0;

            if (count500 < 1000) {
                return { 
                    canClaim: true, 
                    claimed: false, 
                    amount: 500, 
                    remaining: 1000 - count500,
                    type: 'welcome_500' as const
                };
            }

            return { canClaim: false, claimed: false, message: "All welcome bonuses claimed" };
        }),

    claimWelcomeBonus: protectedProcedure
        .mutation(async ({ ctx }) => {
            const userId = ctx.user.id;

            if (ctx.user.accountType !== 'personal') {
                throw new TRPCError({ code: "FORBIDDEN", message: "Only personal accounts are eligible" });
            }

            // Use CTEs to handle the check-and-claim logic atomically in a single query
            // This avoids the need for transactions which aren't supported by the neon-http driver
            const result = await db.execute(sql`
                WITH 
                  user_status AS (
                    SELECT 1 AS claimed 
                    FROM bonus_claims 
                    WHERE user_id = ${userId} 
                      AND bonus_type IN ('welcome_2000', 'welcome_500')
                  ),
                  counts AS (
                    SELECT 
                      COUNT(*) FILTER (WHERE bonus_type = 'welcome_2000') as count_2000,
                      COUNT(*) FILTER (WHERE bonus_type = 'welcome_500') as count_500
                    FROM bonus_claims
                  ),
                  decision AS (
                    SELECT 
                      CASE 
                        WHEN EXISTS (SELECT 1 FROM user_status) THEN NULL
                        WHEN (SELECT count_2000 FROM counts) < 100 THEN 'welcome_2000'
                        WHEN (SELECT count_500 FROM counts) < 1000 THEN 'welcome_500'
                        ELSE NULL
                      END as bonus_to_claim,
                      CASE 
                        WHEN EXISTS (SELECT 1 FROM user_status) THEN 0
                        WHEN (SELECT count_2000 FROM counts) < 100 THEN 2000
                        WHEN (SELECT count_500 FROM counts) < 1000 THEN 500
                        ELSE 0
                      END as xp_amount
                  ),
                  inserted_claim AS (
                    INSERT INTO bonus_claims (user_id, bonus_type)
                    SELECT ${userId}, bonus_to_claim::bonus_type
                    FROM decision
                    WHERE bonus_to_claim IS NOT NULL
                    RETURNING bonus_type
                  ),
                  updated_user AS (
                    UPDATE users
                    SET xp = COALESCE(xp, 0) + (SELECT xp_amount FROM decision)
                    WHERE id = ${userId} 
                      AND EXISTS (SELECT 1 FROM decision WHERE bonus_to_claim IS NOT NULL)
                    RETURNING xp
                  )
                SELECT 
                  (SELECT bonus_to_claim FROM decision) as claimed_bonus,
                  (SELECT xp_amount FROM decision) as claimed_amount
            `);

            const row = result.rows[0];
            
            if (!row || !row.claimed_bonus) {
                // Check if it was because already claimed or no bonuses left
                const [existingClaim] = await db
                    .select()
                    .from(bonusClaims)
                    .where(and(
                        eq(bonusClaims.userId, userId),
                        sql`${bonusClaims.bonusType} IN ('welcome_2000', 'welcome_500')`
                    ));

                if (existingClaim) {
                    throw new TRPCError({ code: "FORBIDDEN", message: "Bonus already claimed" });
                }
                
                throw new TRPCError({ code: "NOT_FOUND", message: "No bonuses available" });
            }

            return { amount: Number(row.claimed_amount) };
        }),

    buyById: protectedProcedure
        .input(
            z.object({
                assetId: z.string().uuid(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            const { assetId } = input;

            // 1. Fetch the asset to get its real price
            const [asset] = await db
                .select({ price: assets.price })
                .from(assets)
                .where(eq(assets.assetId, assetId))
                .limit(1);

            if (!asset) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Asset not found.",
                });
            }

            const price = asset.price;

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

            const [recipient] = await db.select().from(users).where(eq(users.id, recipientId));
            
            if (!recipient) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Recipient not found.",
                });
            }

            if (recipient.accountType === 'business') {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Business accounts cannot be boosted.",
                });
            }

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

            // Create boost notification (only if not boosting own channel)
            if (userId !== recipientId) {
                await db.insert(notifications).values({
                    userId: recipientId, // Recipient of the boost (channel owner)
                    type: 'boost',
                    relatedUserId: userId, // Who boosted
                    boostAmount: price, // Amount of XP boosted
                });
            }

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



});
