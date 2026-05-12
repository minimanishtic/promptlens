-- Razorpay subscription columns on api_keys.
-- One Razorpay subscription per row; webhook propagates tier across the user's keys.

alter table api_keys
  add column if not exists razorpay_customer_id     text,
  add column if not exists razorpay_subscription_id text,
  add column if not exists subscription_status      text;

-- One subscription belongs to at most one key row.
create unique index if not exists api_keys_razorpay_subscription_id_uidx
  on api_keys(razorpay_subscription_id)
  where razorpay_subscription_id is not null;

-- Fast lookup by customer (de-dupes the "create customer twice" case).
create index if not exists api_keys_razorpay_customer_id_idx
  on api_keys(razorpay_customer_id)
  where razorpay_customer_id is not null;
