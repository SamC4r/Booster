import { db } from "@/db";
import { videos } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { publicRateLimit } from "@/lib/ratelimit";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(req: Request) {
  try {
    // Rate limit by IP to prevent abuse of OpenAI API
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
    const { success } = await publicRateLimit.limit(`ai-search:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    //Tomar el search input del usuario y crear el embedding
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text") || "";

    if (!text || text.length === 0) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
      });
    }

    const embeddingResponse = await openai.embeddings.create({
      // Use OpenAI's newer text-embedding-3 family for improved embeddings
      model: "text-embedding-3-small",
      input: text,
    });
    const embedding = embeddingResponse.data[0].embedding;

    //Luego, buscar los vectores mas parecidos en la base de datos usando el embedding

    // Some Postgres drivers send array params as composite/record types which
    // prevents direct casting to `vector`. Build a vector literal and inject it
    // as raw SQL so pg sees a proper `vector` literal and the `<->` operator
    // will work as intended.
    const embeddingArr = (embedding || []).map((n: unknown) => Number(n));
    if (!Array.isArray(embeddingArr) || embeddingArr.length === 0 || embeddingArr.some(Number.isNaN)) {
      throw new Error('Invalid embedding returned from OpenAI');
    }

    const vecLiteral = `'[${embeddingArr.join(',')}]'::vector`;

    const rows = await db.execute(
      sql`
        SELECT *, embedding <-> ${sql.raw(vecLiteral)} AS distance, categories.name as category_name
        FROM ${videos}
        LEFT JOIN categories ON categories.id = ${videos.categoryId}
        ORDER BY embedding <-> ${sql.raw(vecLiteral)}
        LIMIT 10;
      `
    );

    // Define the expected row type for better type safety
    type RowType = {
      category_name?: string;
      category?: { name?: string };
      [key: string]: any;
    };

    // Build simple recommendations: top categories from the returned rows
    const categoryCounts: Record<string, number> = {};
    for (const r of rows.rows as RowType[]) {
      const name = r.category_name || (r.category && (r.category as { name?: string }).name) || "Unknown";
      categoryCounts[name] = (categoryCounts[name] || 0) + 1;
    }
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    return NextResponse.json({ results: rows, recommendations: { topCategories } });
  } catch (error) {
    console.error("Error generating embedding or querying database:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
