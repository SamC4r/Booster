-- Create the messages table in Supabase
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null,
  sender_id text not null, -- Storing Clerk/Neon User ID as text
  receiver_id text not null, -- Storing Clerk/Neon User ID as text
  is_read boolean default false
);

-- Enable Row Level Security (RLS)
alter table public.messages enable row level security;

-- Create policies
-- Allow users to read messages where they are the sender or receiver
create policy "Users can read their own messages"
on public.messages for select
using (
  auth.uid()::text = sender_id or auth.uid()::text = receiver_id
  -- Note: If you are using Supabase Auth, auth.uid() works. 
  -- If you are using Clerk and just using Supabase as a DB, you might need to bypass RLS with the service role key 
  -- or sync your Clerk users to Supabase Auth.
  -- Since we are using the Service Role Key in the TRPC backend, RLS is bypassed there.
  -- But for the client-side Realtime subscription to work securely, you need a way to authenticate.
  -- If you are just using the backend to fetch, RLS matters less if you only use Service Role.
);

-- Allow users to insert messages where they are the sender
create policy "Users can insert their own messages"
on public.messages for insert
with check (
  auth.uid()::text = sender_id
);

-- Enable Realtime for this table
alter publication supabase_realtime add table public.messages;
