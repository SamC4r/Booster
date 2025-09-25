import { relations } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, uniqueIndex, integer, pgEnum, primaryKey, AnyPgColumn,boolean } from "drizzle-orm/pg-core";

import {
    createInsertSchema,
    createSelectSchema,
    createUpdateSchema
} from "drizzle-zod"

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").unique().notNull(),
    name: text().notNull(),
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),about: text("about"),
    xp: integer("xp").default(0), // THis is the virtual currency to trade and boost a channel
    boostPoints: integer("boost_points").default(0), // to measure the amount of boost given to the channel (amount of XP given to the channel). Can only be done with xp
    // level: integer("level").default(1),
    newLevelUpgrade: timestamp("new_level_at")
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

export const videos = pgTable("videos", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text().notNull(),
    description: text(),

    muxStatus: text("mux_status"),
    muxAssetId: text("mux_asset_id").unique(),
    muxUploadId: text("mux_upload_id").unique(),
    muxPlaybackId: text("mux_playback_id").unique(),
    muxTrackId: text("mux_track_id").unique(), // for subtitles
    muxTrackStatus: text("mux_track_status"), //for subtitles

    thumbnailUrl: text("thumbnail_url"),
    thumbnailKey: text("thumbnail_key"),

    previewUrl: text("preview_url"),
    previewKey: text("preview_key"),

    duration: integer("duration").default(0).notNull(),
    visibility: videoVisibility('visibility').default('private').notNull(),

    userId: uuid("user_id").references(() => users.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
    }).notNull(),

    categoryId: uuid("category_id").references(() => categories.id, {
        onDelete: 'set null',
    }),

    isFeatured: boolean("is_featured").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const videoInsertSchema = createInsertSchema(videos);
export const videoUpdateSchema = createUpdateSchema(videos);
export const videoSelectSchema = createSelectSchema(videos);


//might not be necessary in postgresql because foreign keys already exist
export const videoRelations = relations(videos, ({ one }) => (
    {
        user: one(users, {
            fields: [videos.userId],
            references: [users.id]
        })
    }
))


export const videoViews = pgTable("video_views", {
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    seen: integer("seen").default(1),

}, (t) => [
    primaryKey({
        name: "video_views_pk",
        columns: [t.userId, t.videoId]
    })
])

export const videoViewSelectSchema = createSelectSchema(videoViews);
export const videoViewInsertSchema = createInsertSchema(videoViews);
export const videoViewUpdateSchema = createUpdateSchema(videoViews);



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
    userId: uuid("user_id").references(() => users.id).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
    primaryKey({
        name: "reactions_pk",
        columns: [table.userId, table.commentId]
    })
]);


export const channelBoost = pgTable("channel_boost", {
    boostId: uuid().primaryKey().defaultRandom(),
    creatorId: uuid("creator_id").references(()=>users.id).notNull(),
    boosterId: uuid("booster_id").references(() => users.id).notNull(),
    xp: integer("xp").notNull(),
})