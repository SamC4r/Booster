
import { db } from "@/db";
import { assets } from "@/db/schema";
import { eq } from "drizzle-orm";

const TITLES_TO_SEED = [
    { name: "CEO", price: 5000, category: "titles", description: "Chief Executive Officer title", iconNumber: 0 },
    { name: "BornToBoost", price: 3000, category: "titles", description: "Born to Boost title", iconNumber: 0 },
    { name: "President", price: 10000, category: "titles", description: "President title", iconNumber: 0 },
    { name: "Founder figure", price: 8000, category: "titles", description: "Founder figure title", iconNumber: 0 },
];

async function main() {
    console.log("Seeding titles...");

    for (const title of TITLES_TO_SEED) {
        const existing = await db.select().from(assets).where(eq(assets.name, title.name));
        
        if (existing.length === 0) {
            console.log(`Inserting ${title.name}...`);
            await db.insert(assets).values(title);
        } else {
            console.log(`Skipping ${title.name} (already exists)`);
        }
    }

    console.log("Done!");
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
