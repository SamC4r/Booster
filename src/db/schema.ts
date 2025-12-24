import { pgTable, text, uuid, timestamp, uniqueIndex, integer, pgEnum, primaryKey, AnyPgColumn, boolean, index, vector, real } from "drizzle-orm/pg-core";

import {
    createInsertSchema,
    createSelectSchema,
    createUpdateSchema
} from "drizzle-zod"

export const userAccountType = pgEnum("user_account_type", [
    'personal',
    'business'
])

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").unique().notNull(),
    name: text().notNull(),
    username: text("username"),
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    about: text("about"),
    instagram: text("instagram"),
    twitter: text("twitter"),
    youtube: text("youtube"),
    tiktok: text("tiktok"),
    discord: text("discord"),
    website: text("website"),
    xp: integer("xp").default(0), // THis is the virtual currency to trade and boost a channel
    boostPoints: integer("boost_points").default(0), // to measure the amount of boost given to the channel (amount of XP given to the channel). Can only be done with xp
    // level: integer("level").default(1),
    newLevelUpgrade: timestamp("new_level_at"),
    equippedAssetId: uuid("equipped_asset_id").references((): AnyPgColumn => assets.assetId), // The currently equipped/displayed asset icon
    equippedTitleId: uuid("equipped_title_id").references((): AnyPgColumn => assets.assetId), // The currently equipped title
    rewardedAdsEnabled: boolean("rewarded_ads_enabled").default(false),
    accountType: userAccountType("account_type"),
    businessDescription: text("business_description"),
    businessImageUrls: text("business_image_urls").array(),
    dailyWatchCount: integer("daily_watch_count").default(0).notNull(),
    lastDailyXpReset: timestamp("last_daily_xp_reset").defaultNow().notNull(),

    // YouTube Sync
    youtubeAccessToken: text("youtube_access_token"),
    youtubeRefreshToken: text("youtube_refresh_token"),
    youtubeTokenExpiry: timestamp("youtube_token_expiry"),
    youtubeChannelId: text("youtube_channel_id"),
}, (t) => [uniqueIndex("clerk_id_idx").on(t.clerkId)]);

//create index on clerk_id to query faster. --> speed up WHERE, JOIN, ORDER BY clauses. B-Tree sorted by the column I index
//an index increases read speed


// typescript property name: define column names type("column_name")

//bunx drizzle-kit push  --> commit schema changes to neon db

export const categories = pgTable("categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text().notNull().unique(),
    description: text(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("name_idx").on(t.name)])

export const videoVisibility = pgEnum("video_visibility", [
    'private',
    'public',
])

export const videoStatus = pgEnum("video_status", [
    'error',
    'processing',
    'completed'
])

export const videos = pgTable("videos", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text().notNull(),
    description: text(),

    // muxStatus: text("mux_status"),
    // muxAssetId: text("mux_asset_id").unique(),
    // muxUploadId: text("mux_upload_id").unique(),
    // muxPlaybackId: text("mux_playback_id").unique(),
    // muxTrackId: text("mux_track_id").unique(), // for subtitles
    // muxTrackStatus: text("mux_track_status"), //for subtitles

    playbackUrl: text("playback_url"),

    thumbnailUrl: text("thumbnail_url"),
    thumbnailKey: text("thumbnail_key"),

    previewUrl: text("preview_url"),
    previewKey: text("preview_key"),

    bunnyVideoId: text("bunny_video_id").unique(),        
    bunnyLibraryId: text("bunny_library_id"),             
    bunnyStatus: text("bunny_status"),                    
    bunnyDuration: integer("bunny_duration"),             

    duration: integer("duration").default(0).notNull(),
    visibility: videoVisibility('visibility').default('private').notNull(),
    status: videoStatus().default('processing').notNull(),

    youtubeVideoId: text("youtube_video_id").unique(),

    userId: uuid("user_id").references(() => users.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
    }).notNull(),

    categoryId: uuid("category_id").references(() => categories.id, {
        onDelete: 'set null',
    }),

    isFeatured: boolean("is_featured").default(false),

    s3Name: text("s3_name").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

    isAi: boolean("is_ai").notNull().default(false),
    embedding: vector("embedding", { dimensions: 1536 } ), // OpenAI text-embedding-ada-002 dimension is 1536

    commentCount: integer("comment_count").default(0).notNull(),
    ratingCount: integer("rating_count").default(0).notNull(),
    averageRating: real("average_rating").default(0).notNull(),
    trendingScore: integer("trending_score").default(0).notNull(),
}, (t) => [
    index("videos_user_idx").on(t.userId),
    index("videos_category_idx").on(t.categoryId),
    index("videos_visibility_status_idx").on(t.visibility, t.status),
    index("videos_created_at_idx").on(t.createdAt),
    index("videos_featured_idx").on(t.isFeatured),
    index("videos_trending_idx").on(t.trendingScore),
])

export const videoInsertSchema = createInsertSchema(videos);
export const videoUpdateSchema = createUpdateSchema(videos);
export const videoSelectSchema = createSelectSchema(videos);


//might not be necessary in postgresql because foreign keys already exist
// export const videoRelations = relations(videos, ({ one }) => (
//     {
//         user: one(users, {
//             fields: [videos.userId],
//             references: [users.id]
//         })
//     }
// ))


export const videoViews = pgTable("video_views", {
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    seen: integer("seen").default(1),

}, (t) => [
    primaryKey({
        columns: [t.userId, t.videoId]
    })
])

export const videoViewSelectSchema = createSelectSchema(videoViews);
export const videoViewInsertSchema = createInsertSchema(videoViews);
export const videoViewUpdateSchema = createUpdateSchema(videoViews);


export const rewardedView = pgTable("rewarded_view", {
    userId: uuid("user_id").references(() => users.id, {onDelete: "cascade"}).notNull(),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    xpEarned: integer("xp_earned"),
}, (t) => [
    primaryKey({
        name: "video_views_pk",
        columns: [t.userId, t.videoId]
    })
])


export const videoRatings = pgTable("video_ratings", {
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    rating: integer("rating"),
}, (t) => [
    primaryKey({
        name: "video_rating_pk",
        columns: [t.userId, t.videoId]
    })
])


export const videoRatingsSelectSchema = createSelectSchema(videoRatings);
export const videoRatingsInsertSchema = createInsertSchema(videoRatings);
export const videoRatingsUpdateSchema = createUpdateSchema(videoRatings);


export const userFollows = pgTable(
    "user_follows",
    {
        userId: uuid("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        creatorId: uuid("creator_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        primaryKey({
            name: "follows_pk",
            columns: [table.userId, table.creatorId]
        })
    ]);

export const comments = pgTable("comments", {
    commentId: uuid("comment_id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
    comment: text("comment").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => comments.commentId, { onDelete: "cascade" }),
    replies: integer("replies").default(0).notNull(),
})

export const commentReactions = pgTable("comment_reactions", {
    commentId: uuid("comment_id").references(() => comments.commentId, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
    primaryKey({
        name: "reactions_pk",
        columns: [table.userId, table.commentId]
    })
]);


export const boostTransactions = pgTable("boost_transactions", {
    boostId: uuid().primaryKey().defaultRandom(),
    creatorId: uuid("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    boosterId: uuid("booster_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    xp: integer("xp").notNull(),
})


export const stripeProcessedEvents = pgTable("stripe_processed_events", {
    id: text("id").primaryKey(),              // Stripe event.id
    processedAt: timestamp("processed_at").defaultNow(),
});

export const xpPurchases = pgTable("xp_purchases", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    xp: integer("xp").notNull(),
    amountCents: integer("amount_cents").notNull(),
    priceLookupKey: text("price_lookup_key").notNull(),
    paymentIntentId: text("payment_intent_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const assets = pgTable("assets", {
    assetId: uuid("asset_id").primaryKey().defaultRandom(),
    price: integer("price").notNull().default(0),
    name: text("asset_name").notNull(),
    category: text("category"),
    description: text("asset_description").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    iconNumber: integer("icon_number").notNull().default(0),
    requiredLevel: integer("required_level").default(0), // Level required to unlock this reward
})

export const userAssets = pgTable("user_assets", {
    assetId: uuid("asset_id").references(() => assets.assetId, { onDelete: "cascade", onUpdate: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }).notNull(),
}, (t) => [
    primaryKey({
        name: "user_assets_pk",
        columns: [t.assetId, t.userId],
    })
])

export const notificationType = pgEnum("notification_type", [
    'follow',
    'comment',
    'reply',
    'boost',
])

export const notifications = pgTable("notifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // Recipient of the notification
    type: notificationType('type').notNull(),
    
    // Foreign keys for different notification types
    relatedUserId: uuid("related_user_id").references(() => users.id, { onDelete: "cascade" }), // Who followed/commented/boosted
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }), // Video that was commented on
    commentId: uuid("comment_id").references(() => comments.commentId, { onDelete: "cascade" }), // Comment/reply
    boostAmount: integer("boost_amount"), // Amount of XP boosted
    
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
    index("notifications_user_idx").on(t.userId),
    index("notifications_user_unread_idx").on(t.userId, t.isRead),
    index("notifications_created_at_idx").on(t.createdAt),
])

export const messages = pgTable("messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    receiverId: uuid("receiver_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    content: text("content").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
    index("messages_sender_idx").on(t.senderId),
    index("messages_receiver_idx").on(t.receiverId),
    index("messages_created_at_idx").on(t.createdAt),
    index("messages_receiver_unread_idx").on(t.receiverId, t.isRead),
])

export const messageInsertSchema = createInsertSchema(messages);
export const messageSelectSchema = createSelectSchema(messages);

export const bonusType = pgEnum("bonus_type", [
    'welcome_2000',
    'welcome_500'
])

export const bonusClaims = pgTable("bonus_claims", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    bonusType: bonusType("bonus_type").notNull(),
    claimedAt: timestamp("claimed_at").defaultNow().notNull(),
}, (t) => [
    index("bonus_claims_user_idx").on(t.userId),
    index("bonus_claims_type_idx").on(t.bonusType),
])

