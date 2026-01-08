import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import z from "zod";

import { auth } from "@clerk/nextjs/server"
import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const f = createUploadthing();

// const auth = (req: Request) => ({ id: "fakeId" }); // Fake auth function

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    thumbnailUploader: f({
        image: {
            /**
             * For full list of options and defaults, see the File Route API reference
             * @see https://docs.uploadthing.com/file-routes#route-config
             */
            maxFileSize: "2MB",
            maxFileCount: 1,
        },
    })
        .input(z.object({
            videoId: z.string().uuid(),
        }))
        // Set permissions and file types for this FileRoute
        .middleware(async ({ input }) => {
            // This code runs on your server before upload
            const { userId: clerkUserId } = await auth();

            // If you throw, the user will not be able to upload
            if (!clerkUserId) throw new UploadThingError("Unauthorized");

            const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUserId))

            if (!user) {
                throw new UploadThingError("Unauthorized")
            }

            const [existingVideo] = await db
                .select({
                    thumbnailKey: videos.thumbnailKey,
                })
                .from(videos)
                .where(and(
                    eq(videos.id, input.videoId),
                    eq(videos.userId, user.id),
                ))

            if (!existingVideo) {
                throw new UploadThingError("Not found");
            }

            if (existingVideo.thumbnailKey) {
                const utapi = new UTApi();

                await utapi.deleteFiles(existingVideo.thumbnailKey);
                await db
                    .update(videos)
                    .set({ thumbnailKey: null, thumbnailUrl: null })
                    .where(and(
                        eq(videos.id, input.videoId),
                        eq(videos.userId, user.id)
                    ));
            }

            // Whatever is returned here is accessible in onUploadComplete as `metadata`
            return { user, ...input };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // This code RUNS ON YOUR SERVER after upload
            await db
                .update(videos)
                .set({
                    thumbnailUrl: file.url,
                    thumbnailKey: file.key,
                }).where(and(
                    eq(videos.id, metadata.videoId),
                    eq(videos.userId, metadata.user.id),
                ))

            // console.log("Upload complete for userId:", metadata.user.id);

            // console.log("file url", file.ufsUrl);

            // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
            return { uploadedBy: metadata.user.id };
        }),

    businessImageUploader: f({
        image: {
            maxFileSize: "2MB",
            maxFileCount: 5,
        },
    })
        .middleware(async () => {
            const { userId: clerkUserId } = await auth();
            if (!clerkUserId) throw new UploadThingError("Unauthorized");

            const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUserId));

            if (!user || user.accountType !== 'business') {
                throw new UploadThingError("Unauthorized: Business account required");
            }

            return { userId: user.id };
        })
        .onUploadComplete(async ({ file }) => {
            return { url: file.url, key: file.key };
        }),

    communityImageUploader: f({
        image: {
            maxFileSize: "2MB",
            maxFileCount: 1,
        },
    })
        .middleware(async () => {
            const { userId: clerkUserId } = await auth();
            if (!clerkUserId) throw new UploadThingError("Unauthorized");
            return { userId: clerkUserId };
        })
        .onUploadComplete(async ({ file }) => {
            return { url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
