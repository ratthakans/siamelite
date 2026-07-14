-- ============================================================================
-- Siam Elite — Create the ONE admin login (no dashboard clicking needed)
-- ----------------------------------------------------------------------------
-- HOW TO RUN (after 01_backoffice_schema.sql):
--   1. Change the TWO lines marked  👇  below (your email + a password).
--   2. Supabase → SQL Editor → New query → paste ALL of this → Run.
--   3. Go to /admin.html and log in. Done.
--
-- Re-running with the same email just RESETS the password — handy if you
-- ever forget it. Your password is NOT stored in this repo; you type it here.
-- ============================================================================

create extension if not exists pgcrypto;

do $$
declare
  admin_email    text := 'admin@siamelite.co';        -- 👈 your login email
  admin_password text := 'CHANGE-THIS-PASSWORD';        -- 👈 your password (min 6 chars)
  uid uuid;
begin
  -- safety: refuse to run until you actually pick a password
  if admin_password = 'CHANGE-THIS-PASSWORD' or length(admin_password) < 6 then
    raise exception 'Set a real password (min 6 chars) on the admin_password line first.';
  end if;

  select id into uid from auth.users where email = admin_email;

  if uid is not null then
    -- user already exists → just reset the password
    update auth.users
      set encrypted_password = crypt(admin_password, gen_salt('bf')),
          updated_at = now(),
          email_confirmed_at = coalesce(email_confirmed_at, now())
      where id = uid;
    raise notice 'Admin password reset for %', admin_email;
    return;
  end if;

  -- create a fresh admin user
  uid := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    admin_email, crypt(admin_password, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}',
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, admin_email,
    jsonb_build_object('sub', uid::text, 'email', admin_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  raise notice 'Admin user created: %', admin_email;
end $$;

-- ============================================================================
-- If this ever errors on your Supabase version, use the dashboard fallback:
--   Authentication → Users → Add user → Create new user
--   (enter the same email + password, tick "Auto Confirm User").
-- ============================================================================
