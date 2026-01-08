import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Starting migration...");

    // Update view counts
    console.log("Updating view counts...");
    await db.execute(sql`
        UPDATE videos v
        SET view_count = (
            SELECT COALESCE(SUM(seen), 0)
            FROM video_views vv
            WHERE vv.video_id = v.id
        )
    `);

    // Update comment counts
    console.log("Updating comment counts...");
    await db.execute(sql`
        UPDATE videos v
        SET comment_count = (
            SELECT COUNT(*)
            FROM comments c
            WHERE c.video_id = v.id
        )
    `);

    // Update rating counts
    console.log("Updating rating counts...");
    await db.execute(sql`
        UPDATE videos v
        SET rating_count = (
            SELECT COUNT(*)
            FROM video_ratings vr
            WHERE vr.video_id = v.id
        ),
        average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM video_ratings vr
            WHERE vr.video_id = v.id
        )
    `);

    console.log("Migration complete.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
