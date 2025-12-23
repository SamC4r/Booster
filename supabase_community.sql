-- Create the community_messages table in Supabase
create table public.community_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null,
  channel_id text not null, -- The community owner (Neon User ID)
  user_id text not null -- The sender (Neon User ID)
);

-- Enable Row Level Security (RLS)
alter table public.community_messages enable row level security;

-- Create policies
-- Allow anyone to read messages (public channels)
create policy "Anyone can read community messages"
on public.community_messages for select
using (true);

-- Allow authenticated users (via service role or if we sync auth) to insert
-- Since we use TRPC with Service Role, this policy is mostly for if we allowed direct client access.
-- But for Realtime to work, we need policies.
create policy "Service role can do everything"
on public.community_messages
using (true)
with check (true);

-- Enable Realtime for this table
alter publication supabase_realtime add table public.community_messages;
