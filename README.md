
<img width="1170" height="220" alt="FinishedLongLogo" src="https://github.com/user-attachments/assets/aa896884-126b-40c7-aa61-1125a6e3d197" />

<img width="3794" height="1885" alt="Boosterwithvertical" src="https://github.com/user-attachments/assets/4f4a0e9e-75d6-450f-846c-521877520537" />

<img width="1866" height="1387" alt="Screenshot 2025-12-23 183455" src="https://github.com/user-attachments/assets/bdfec408-5fa9-44a6-bd64-4e9cfa9f6c6d" />


<img width="1906" height="938" alt="Screenshot 2025-12-17 135154" src="https://github.com/user-attachments/assets/3aa737c8-78a8-4596-bea7-abea34242999" />






## Project Setup

Instructions to get the project up and running

### 1. Install Dependencies

First, install the necesarry dependencies. We use `bun` as our package manager


```bash
# Using bun (recommended)
bun install
# Or with yarn
yarn install
# Or with npm
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root `/` and add the following variables (replace values as needed):

```env
# Database (Get it From Neon DB -> Create an account and a project)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-anon-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key

# Bunny Stream
BUNNY_STREAM_API_KEY=your-bunny-api-key

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token

# UploadThing (For Images)
UPLOADTHING_TOKEN=api_key_for_ut

#CLERK 
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=clerk_test_key
CLERK_SECRET_KEY=clerk_secret_test_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
CLERK_SIGNING_SECRET=secret_for_webhooks


#OpenAi key for the embeddings search
OPENAI_API_KEY= 


```

> **Tip:** Not all features require every variable, but missing values may disable related integrations.

### 3. Run the Development Server

```bash
# Using bun (recommended)
bun run dev
# Or with npm/yarn/pnpm
npm run dev
yarn dev
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

Most of the components logic is under `/modules` to take advantage of tRPC prefetching and caching. 

`(...)` are usually server components where we prefetch data.  You'll usually see the `void trpc. ... .prefetch()` here.


---

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!


## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

