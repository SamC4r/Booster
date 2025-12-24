// export const GET = () => {
//     return new Response("Hello")
// }

import { db } from "@/db"
import { users } from "@/db/schema"
import { UserJSON, WebhookEvent } from "@clerk/nextjs/server"
import { headers } from "next/headers"
import { Webhook } from "svix"

import { eq } from "drizzle-orm"


export async function POST(req: Request) {
    const SIGNING_SECRET = process.env.CLERK_SIGNING_SECRET

    if (!SIGNING_SECRET) {
        throw new Error('No signing secret from Clerk in .env')
    }

    //create new Svix instance with secret
    const wh = new Webhook(SIGNING_SECRET)

    //get headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Missing svix headers", { status: 400 })
    }

    //get body
    const payload = await req.json()
    const body = JSON.stringify(payload)
    let evt: WebhookEvent

    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature
        }) as WebhookEvent
    } catch (err) {
        console.log("Error verifying webhook", err)
        return new Response("Error verifying webhook", { status: 400 })
    }


    //Do something with payload
    const data = evt.data as UserJSON
    const type = evt.type
    // console.log("received webhook with ID ", data.id, "and type", type)
    // console.log("webhook payload",body)

    if (type === "user.created") {
        console.log("A new user was created with ID", data.id)

        let name = `${data.first_name || ""} ${data.last_name || ""}`.trim()
        if (!name) {
            if (data.username && data.username.trim()) {
                name = data.username
            } else {
                name = `Anonymous ${Math.floor(Math.random() * 100000)}`
            }
        }
        name = name.substring(0, 50);

        await db.insert(users).values({
            clerkId: data.id,
            name: name,
            username: data.username,
            imageUrl: data.image_url,
            // prueba: "", // Add a default value or set as needed
        }).catch((err) => {
            console.log("Error inserting user into database", err)
        })
    }

    if (type === "user.deleted") {
        // console.log("A user was deleted with ID", data.id)

        // console.log("data", data)
        if (!data.id) {
            return new Response("No user ID provided", { status: 400 })
        }

        await db.delete(users).where(eq(users.clerkId, data.id)).catch((err) => {
            console.log("Error deleting user from database", err)
        })
        // console.log("User deleted")
    }

    if (type === "user.updated") {
        // console.log("A user was updated with ID", data.id)
        if (!data.id) {
            return new Response("No user ID provided", { status: 400 })
        }
        let name = `${data.first_name || ""} ${data.last_name || ""}`.trim()
        if (!name) {
            if (data.username && data.username.trim()) {
                name = data.username
            } else {
                name = `Anonymous ${Math.floor(Math.random() * 100000)}`
            }
        }
        name = name.substring(0, 50);
        await db.update(users).set({
            name: name,
            username: data.username,
            imageUrl: data.image_url
        }).where(eq(users.clerkId, data.id)).catch((err) => {
            console.log("Error updating user in database", err)
        })
    }

    return new Response("Webhook received", { status: 200 })

}
