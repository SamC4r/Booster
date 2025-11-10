// Quick script to check videos in the database
import { db } from "./src/db";
import { videos } from "./src/db/schema";
import { eq, not } from "drizzle-orm";

async function main() {
    console.log("📊 Checking videos in database...\n");
    
    // Get all videos
    const allVideos = await db.select().from(videos);
    console.log(`Total videos: ${allVideos.length}`);
    
    // Get public videos
    const publicVideos = await db
        .select()
        .from(videos)
        .where(eq(videos.visibility, "public"));
    console.log(`Public videos: ${publicVideos.length}`);
    
    // Get completed videos (not processing)
    const completedVideos = await db
        .select()
        .from(videos)
        .where(not(eq(videos.status, "processing")));
    console.log(`Completed videos: ${completedVideos.length}`);
    
    // Get videos that would show in home feed (public AND not processing)
    const homeVideos = await db
        .select()
        .from(videos)
        .where(
            eq(videos.visibility, "public")
        );
    
    const homeFeedVideos = homeVideos.filter(v => v.status !== "processing");
    console.log(`Videos in home feed: ${homeFeedVideos.length}\n`);
    
    if (allVideos.length > 0) {
        console.log("📝 Video details:");
        allVideos.forEach((video, i) => {
            console.log(`\n${i + 1}. ${video.title}`);
            console.log(`   ID: ${video.id}`);
            console.log(`   Status: ${video.status}`);
            console.log(`   Visibility: ${video.visibility}`);
            console.log(`   Bunny Video ID: ${video.bunnyVideoId || 'None'}`);
        });
    } else {
        console.log("\n⚠️  No videos found in database!");
        console.log("💡 You need to upload videos through the /upload page");
    }
    
    process.exit(0);
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
