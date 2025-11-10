// Test home.getMany query
import { db } from "./src/db";
import { videos, users, videoRatings, comments, videoViews } from "./src/db/schema";
import { eq, and, or, lt, desc, sql, not } from "drizzle-orm";

async function main() {
    console.log("🔍 Testing home.getMany query...\n");
    
    const limit = 10;
    
    // Aggregate ratings
    const ratingsAgg = db
        .select({
            videoId: videoRatings.videoId,
            avgRating: sql<number>`AVG(${videoRatings.rating})`.as('avgRating'),
            ratingCount: sql<number>`COUNT(*)`.as('ratingCount'),
        })
        .from(videoRatings)
        .groupBy(videoRatings.videoId)
        .as("ra");

    // Aggregate comments
    const commentsAgg = db
        .select({
            videoId: comments.videoId,
            commentCount: sql<number>`COUNT(*)`.as('commentCount'),
        })
        .from(comments)
        .groupBy(comments.videoId)
        .as("ca");

    // Aggregate views
    const viewsAgg = db
        .select({
            videoId: videoViews.videoId,
            viewCount: sql<number>`SUM(${videoViews.seen})`.as('viewCount')
        })
        .from(videoViews)
        .groupBy(videoViews.videoId)
        .as("vv");

    const scoreExpr = sql<number>`
        LN(
            POWER(COALESCE(SQRT(${users.boostPoints} * 1000) / 1000, 0) + 1, 1)
            + LN(GREATEST(COALESCE(${viewsAgg.viewCount}, 0), 1))
            + TANH(COALESCE(${ratingsAgg.avgRating}, 0) - 3.5) 
            * LN(GREATEST(COALESCE(${ratingsAgg.ratingCount}, 0), 1))
            + LN(GREATEST(COALESCE(${ratingsAgg.ratingCount}, 0), 1))
            + LN(GREATEST(COALESCE(${commentsAgg.commentCount}, 0), 1))
            + CASE WHEN ${videos.isFeatured} = true THEN 5.0 ELSE 0.0 END
        ) * COALESCE(SQRT(${users.boostPoints} * 1000) / 1000, 0)
    `;

    const whereParts = [and(eq(videos.visibility, "public"), not(eq(videos.status, "processing")))];

    try {
        const rows = await db
            .select({
                id: videos.id,
                title: videos.title,
                updatedAt: videos.updatedAt,
                isFeatured: videos.isFeatured,
                score: scoreExpr.as("score"),
            })
            .from(videos)
            .leftJoin(users, eq(users.id, videos.userId))
            .leftJoin(ratingsAgg, eq(ratingsAgg.videoId, videos.id))
            .leftJoin(commentsAgg, eq(commentsAgg.videoId, videos.id))
            .leftJoin(viewsAgg, eq(viewsAgg.videoId, videos.id))
            .where(and(...whereParts))
            .orderBy(desc(sql`score`))
            .limit(limit + 1);

        console.log(`✅ Query successful! Found ${rows.length} videos\n`);
        
        if (rows.length === 0) {
            console.log("⚠️  No videos returned by the query!");
            console.log("This shouldn't happen since we have 14 public completed videos.");
            console.log("\nPossible issues:");
            console.log("- The score calculation might be returning NaN or negative infinity");
            console.log("- User boost points might all be 0, making score = 0 * something = 0");
        } else {
            console.log("📝 Videos returned:");
            rows.forEach((row, i) => {
                console.log(`\n${i + 1}. ${row.title}`);
                console.log(`   ID: ${row.id}`);
                console.log(`   Score: ${row.score}`);
                console.log(`   Featured: ${row.isFeatured}`);
            });
        }
    } catch (error) {
        console.error("❌ Query failed:", error);
    }
    
    process.exit(0);
}

main();
