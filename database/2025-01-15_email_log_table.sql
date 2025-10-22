-- Create email_log table for tracking marketing email sends
create table email_log (
  id bigint primary key generated always as identity,
  from_email text not null,
  subject text not null,
  recipients text[] not null,
  emails_sent integer not null default 0,
  emails_failed integer not null default 0,
  sent_at timestamp with time zone default now()
);

-- Add index for querying by date
create index idx_email_log_sent_at on email_log(sent_at desc);

-- Add index for querying by from_email
create index idx_email_log_from_email on email_log(from_email);

-- Add RLS policy (only admins can read/write)
alter table email_log enable row level security;

-- Policy: Only admins can access email logs
create policy "Only admins can access email logs" on email_log
  for all using (
    exists (
      select 1 from users 
      where users.id = auth.uid() 
      and users.role = 'admin'
    )
  );
