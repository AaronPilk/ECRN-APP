-- ─────────────────────────────────────────────────────────────────────
-- ECRN demo data for the admin dashboards (seed "admin_demo_v1")
--
-- Applied to project izsbniekpywmpjwmheyg on 2026-11-20, one STEP per
-- statement batch (each batch is its own transaction). Kept here for the
-- record. This is NOT a migration and is not run automatically.
--
-- Everything below is fictional and tagged so it can be removed in one go:
--   * members        auth.users / profiles with email seed.<n>@demo.goecrn.com
--   * everything else `metadata` contains {"demo": true, "seed": "admin_demo_v1"}
--                    (staff, profiles, candidates, referrals, job_referrals,
--                     job_applications, payouts, company_leads)
--   * activity_logs  rows written for those records carry {"demo": true}
--   * sync queue     every integration_outbox row the seed caused is
--                    status = 'skipped', last_error = 'demo data'
--
-- Remove it all with:  select public.admin_clear_demo_data();   (Settings > Demo data)
-- or as the database owner:  select private.clear_demo_data();
--
-- The older demo rows (partner@ / candidate@demo.goecrn.com, their 7 sample
-- candidates and the 6 sample jobs) only carry {"demo": true}; the seed does
-- not change them, apart from giving the 6 jobs an owner and recruiters.
--
-- Reproducible: ids are md5-based, and every random choice comes from
-- setseed() + random() over generate_series, so the same STEP gives the same
-- people, cities, statuses and codes. Dates are relative to now().
-- Not idempotent: clear the demo data before running it again.
--
-- Run note: step 9.1 first ran with a single pace for all five referred
-- placements, which put every placement in October. It was re-run with the
-- pacing below (old rows deleted first), followed by 9.5 and 10.4 again, so
-- the database matches what this file produces from scratch.
-- ─────────────────────────────────────────────────────────────────────


-- ═══ STEP 1: demo team (3 account managers, 9 recruiters) ════════════
insert into public.staff (
  id, first_name, last_name, email, phone, title, staff_role, manager_id,
  invite_code, specialties, territories, metadata, created_at, updated_at
)
select
  md5('ecrn-demo-staff-' || v.code)::uuid,
  v.first_name, v.last_name,
  lower(v.first_name || '.' || v.last_name) || '@demo.goecrn.com',
  v.phone, v.title, v.staff_role::public.staff_role,
  case when v.mgr is null then null else md5('ecrn-demo-staff-' || v.mgr)::uuid end,
  v.code, v.specialties::text[], v.territories::text[],
  '{"demo": true, "seed": "admin_demo_v1"}'::jsonb,
  now() - interval '84 days' + v.ord * interval '3 hours',
  now() - interval '84 days' + v.ord * interval '3 hours'
from (values
  ( 1, 'DANAW',   'Dana',   'Whitlock',  'Senior Account Manager', 'account_manager', null,     '{Electrical,Low Voltage}',           '{FL}',       '+18135550191'),
  ( 2, 'GRANTE',  'Grant',  'Ellery',    'Account Manager',        'account_manager', null,     '{Mechanical,General Construction}',  '{GA,SC,NC}', '+14045550191'),
  ( 3, 'RENEEC',  'Renee',  'Castellan', 'Account Manager',        'account_manager', null,     '{Electrical,Low Voltage}',           '{TX}',       '+17135550191'),
  ( 4, 'TORIB',   'Tori',   'Baines',    'Senior Recruiter',       'recruiter',       'DANAW',  '{Electrical}',                       '{FL}',       '+18135550192'),
  ( 5, 'JAVIERS', 'Javier', 'Solano',    'Recruiter',              'recruiter',       'DANAW',  '{Low Voltage,Electrical}',           '{FL}',       '+18135550193'),
  ( 6, 'KENDRAM', 'Kendra', 'Mott',      'Recruiter',              'recruiter',       'DANAW',  '{Estimating,Electrical}',            '{FL}',       '+18135550194'),
  ( 7, 'OWENP',   'Owen',   'Prather',   'Senior Recruiter',       'recruiter',       'GRANTE', '{Mechanical}',                       '{GA}',       '+14045550192'),
  ( 8, 'SIMONEA', 'Simone', 'Achebe',    'Recruiter',              'recruiter',       'GRANTE', '{Electrical}',                       '{NC,SC}',    '+14045550193'),
  ( 9, 'WESL',    'Wes',    'Lindqvist', 'Recruiter',              'recruiter',       'GRANTE', '{General Construction}',             '{GA,SC}',    '+14045550194'),
  (10, 'BIANCAT', 'Bianca', 'Trevino',   'Senior Recruiter',       'recruiter',       'RENEEC', '{Electrical}',                       '{TX}',       '+17135550192'),
  (11, 'COLEH',   'Cole',   'Harwick',   'Recruiter',              'recruiter',       'RENEEC', '{Low Voltage}',                      '{TX}',       '+17135550193'),
  (12, 'NADIAF',  'Nadia',  'Farouk',    'Recruiter',              'recruiter',       'RENEEC', '{Project Management,Electrical}',    '{TX}',       '+17135550194')
) as v(ord, code, first_name, last_name, title, staff_role, mgr, specialties, territories, phone)
order by v.ord;


-- ═══ STEP 2: the 6 existing jobs get an owner and 1-3 recruiters ═════
-- Nothing else on the job changes. The jobs_owner_changed trigger passes
-- the owner on to the older demo application and job referrals.
update public.jobs j
set account_manager_id = md5('ecrn-demo-staff-' || v.am)::uuid
from (values
  ('Senior Electrical Project Manager',        'DANAW'),
  ('Electrical Estimator',                     'DANAW'),
  ('Assistant Project Manager — Electrical',   'DANAW'),
  ('Mechanical Project Manager',               'GRANTE'),
  ('Construction Superintendent — Healthcare', 'GRANTE'),
  ('Low Voltage Project Manager',              'RENEEC')
) as v(title, am)
where j.title = v.title and j.account_manager_id is null;

insert into public.job_recruiters (job_id, staff_id, created_at)
select j.id, md5('ecrn-demo-staff-' || v.code)::uuid, now() - interval '80 days'
from (values
  ('Senior Electrical Project Manager',        'TORIB'),
  ('Senior Electrical Project Manager',        'KENDRAM'),
  ('Electrical Estimator',                     'KENDRAM'),
  ('Electrical Estimator',                     'TORIB'),
  ('Electrical Estimator',                     'JAVIERS'),
  ('Assistant Project Manager — Electrical',   'TORIB'),
  ('Mechanical Project Manager',               'OWENP'),
  ('Mechanical Project Manager',               'WESL'),
  ('Construction Superintendent — Healthcare', 'WESL'),
  ('Construction Superintendent — Healthcare', 'OWENP'),
  ('Construction Superintendent — Healthcare', 'SIMONEA'),
  ('Low Voltage Project Manager',              'COLEH'),
  ('Low Voltage Project Manager',              'BIANCAT')
) as v(title, code)
join public.jobs j on j.title = v.title
on conflict do nothing;


-- ═══ STEP 3: 80 members ══════════════════════════════════════════════
-- auth.users -> profiles through the on_auth_user_created trigger, which
-- also attributes the sign-up from raw_user_meta_data.invite_code /
-- invited_by. 46 use a team member's code (Tori, Bianca, Owen and Javier
-- lead), 7 come through another member's invite, 27 are organic.
select setseed(0.4201);

with cities(ord, city, st, area, region, w) as (values
  ( 1, 'Tampa',           'FL', '813', 'FL', 9),
  ( 2, 'Orlando',         'FL', '407', 'FL', 7),
  ( 3, 'Miami',           'FL', '305', 'FL', 5),
  ( 4, 'Jacksonville',    'FL', '904', 'FL', 5),
  ( 5, 'St. Petersburg',  'FL', '727', 'FL', 4),
  ( 6, 'Fort Lauderdale', 'FL', '954', 'FL', 3),
  ( 7, 'Sarasota',        'FL', '941', 'FL', 2),
  ( 8, 'Lakeland',        'FL', '863', 'FL', 2),
  ( 9, 'Fort Myers',      'FL', '239', 'FL', 1),
  (10, 'Tallahassee',     'FL', '850', 'FL', 1),
  (11, 'West Palm Beach', 'FL', '561', 'FL', 1),
  (12, 'Atlanta',         'GA', '404', 'SE', 6),
  (13, 'Savannah',        'GA', '912', 'SE', 2),
  (14, 'Charlotte',       'NC', '704', 'SE', 4),
  (15, 'Raleigh',         'NC', '919', 'SE', 3),
  (16, 'Charleston',      'SC', '843', 'SE', 3),
  (17, 'Greenville',      'SC', '864', 'SE', 2),
  (18, 'Houston',         'TX', '713', 'TX', 6),
  (19, 'Dallas',          'TX', '214', 'TX', 5),
  (20, 'Austin',          'TX', '512', 'TX', 3),
  (21, 'San Antonio',     'TX', '210', 'TX', 1)
),
g as materialized (
  select n, random() as r_city, random() as r_code, random() as r_plat, random() as r_time
  from generate_series(1, 80) as n
),
city_slots as (
  select row_number() over (order by c.ord, s.i) as slot, c.city, c.st, c.area, c.region
  from cities c cross join lateral generate_series(1, c.w) as s(i)
),
normal as (
  -- everyone except the five members who live outside every territory
  select g.n, row_number() over (order by g.r_city) as slot
  from g where g.n not in (9, 27, 44, 58, 73)
),
located as (
  select nm.n, cs.area, cs.region
  from normal nm join city_slots cs using (slot)
  union all
  select v.n, v.area, 'OTHER'
  from (values (9, '615'), (27, '205'), (44, '804'), (58, '865'), (73, '205')) as v(n, area)
),
codes(region, ord, code, cnt) as (values
  ('FL', 1, 'TORIB', 12),  ('FL', 2, 'JAVIERS', 6), ('FL', 3, 'KENDRAM', 3), ('FL', 4, 'DANAW', 1),
  ('SE', 1, 'OWENP', 8),   ('SE', 2, 'SIMONEA', 4), ('SE', 3, 'WESL', 1),
  ('TX', 1, 'BIANCAT', 8), ('TX', 2, 'COLEH', 2),   ('TX', 3, 'NADIAF', 1)
),
code_slots as (
  select c.region, c.code, row_number() over (partition by c.region order by c.ord, s.i) as rk
  from codes c cross join lateral generate_series(1, c.cnt) as s(i)
),
ranked as (
  -- 24, 33, 41, 50, 59, 68, 77 sign up through another member's invite instead of a recruiter code
  select l.n, l.region, g.r_code, row_number() over (partition by l.region order by g.r_code) as rk
  from located l join g using (n)
  where l.region <> 'OTHER' and l.n not in (24, 33, 41, 50, 59, 68, 77)
),
coded as (
  select r.n, r.region, r.r_code, cs.code
  from ranked r join code_slots cs on cs.region = r.region and cs.rk = r.rk
),
invitees as (
  select l.n,
         (select c.n from coded c where c.n <= l.n - 5
          order by (c.region = l.region) desc, c.r_code limit 1) as inviter_n
  from located l where l.n in (24, 33, 41, 50, 59, 68, 77)
),
plan as (
  select g.n,
         md5('ecrn-demo-seed-member-' || g.n)::uuid as id,
         'seed.' || g.n || '@demo.goecrn.com' as email,
         (array['Aiden','Brianna','Caleb','Danielle','Elijah','Fatima','Gavin','Hannah','Isaac','Jocelyn',
                'Keith','Lauren','Mateo','Naomi','Omar','Paige','Quentin','Rosa','Sean','Tessa',
                'Ulises','Valerie','Wyatt','Ximena','Yusuf','Zoe','Andre','Bethany','Curtis','Delia',
                'Emmett','Faith','Gerald','Holly','Ivan','Jenna','Kofi','Leah','Miles','Nora'])[1 + (7 * g.n + 3) % 40] as first_name,
         (array['Abbott','Barrera','Calloway','Dempsey','Eastman','Fontaine','Gallagher','Hargrove','Ibarra','Jennings',
                'Kowalski','Lachance','Mercer','Nakamura','Okafor','Pruitt','Quinlan','Rosario','Sandoval','Thibodeaux',
                'Underwood','Valdez','Whitaker','Yates','Zamora','Ashby','Bellamy','Crenshaw','Driscoll','Easley',
                'Fairchild','Granger','Holcomb','Irving','Jaramillo','Kessler','Lombardi','Maddox','Norwood','Ochoa',
                'Pemberton'])[1 + (11 * g.n + 5) % 41] as last_name,
         '+1' || l.area || '555' || lpad((110 + g.n)::text, 4, '0') as phone,
         c.code as invite_code,
         case when i.inviter_n is not null then md5('ecrn-demo-seed-member-' || i.inviter_n)::uuid end as invited_by,
         case when g.r_plat < 0.45 then 'ios' when g.r_plat < 0.65 then 'android' else 'web' end as platform,
         -- spread over the last 10 weeks, a little denser toward today
         least(
           now() - (70 * (1 - power(((g.n - 0.5) / 80.0)::float8, 0.8::float8))) * interval '1 day'
                 + (g.r_time - 0.5) * interval '14 hours',
           now() - interval '25 minutes' - (80 - g.n) * interval '9 minutes'
         ) as created_at
  from g
  join located l using (n)
  left join coded c using (n)
  left join invitees i using (n)
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, last_sign_in_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select '00000000-0000-0000-0000-000000000000'::uuid, p.id, 'authenticated', 'authenticated', p.email,
       extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),   -- random password nobody knows
       p.created_at,
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_strip_nulls(jsonb_build_object(
         'first_name', p.first_name, 'last_name', p.last_name, 'phone', p.phone,
         'invite_code', p.invite_code, 'invited_by', p.invited_by, 'platform', p.platform)),
       p.created_at, p.created_at, p.created_at,
       '', '', '', ''
from plan p
order by p.n;   -- in sign-up order, so an inviter's profile exists before the person they invited

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
       'email', u.created_at, u.created_at, u.created_at
from auth.users u
where u.email like 'seed.%@demo.goecrn.com'
  and not exists (select 1 from auth.identities i where i.user_id = u.id);


-- ═══ STEP 4: backdate + tag the profiles; 68 of the 80 finish onboarding ═
-- Home city comes from the phone's area code chosen in step 3.
select setseed(0.4202);

with cities(city, st, area) as (values
  ('Tampa', 'FL', '813'), ('Orlando', 'FL', '407'), ('Miami', 'FL', '305'), ('Jacksonville', 'FL', '904'),
  ('St. Petersburg', 'FL', '727'), ('Fort Lauderdale', 'FL', '954'), ('Sarasota', 'FL', '941'),
  ('Lakeland', 'FL', '863'), ('Fort Myers', 'FL', '239'), ('Tallahassee', 'FL', '850'),
  ('West Palm Beach', 'FL', '561'), ('Atlanta', 'GA', '404'), ('Savannah', 'GA', '912'),
  ('Charlotte', 'NC', '704'), ('Raleigh', 'NC', '919'), ('Charleston', 'SC', '843'),
  ('Greenville', 'SC', '864'), ('Houston', 'TX', '713'), ('Dallas', 'TX', '214'), ('Austin', 'TX', '512'),
  ('San Antonio', 'TX', '210'), ('Nashville', 'TN', '615'), ('Birmingham', 'AL', '205'),
  ('Richmond', 'VA', '804'), ('Knoxville', 'TN', '865')
),
places as (
  select c.city, c.st, c.area, pl.lat, pl.lng
  from cities c
  cross join lateral (
    select p.lat, p.lng from public.us_places p
    where p.name = c.city and p.state = c.st
    order by (p.kind = 'city') desc, p.land_sqmi desc nulls last
    limit 1
  ) pl
),
g as materialized (
  select n, random() as r_onb, random() as r_intent, random() as r_disc, random() as r_years,
         random() as r_relo, random() as r_resume, random() as r_tour, random() as r_seen,
         random() as r_seen2, random() as r_emp, random() as r_delay, random() as r_loc
  from generate_series(1, 80) as n
),
m as (
  select pr.id, split_part(split_part(pr.email, '@', 1), '.', 2)::int as n, u.created_at as signed_up,
         pr.phone, pr.signup_platform,
         exists (select 1 from public.profiles x where x.invited_by = pr.id) as is_inviter
  from public.profiles pr
  join auth.users u on u.id = pr.id
  where pr.email like 'seed.%@demo.goecrn.com'
),
onb as (
  -- 12 never finish onboarding; recent sign-ups are more likely to be mid-way
  select m.n, row_number() over (order by g.r_onb / case when m.n > 56 then 3.0 else 1.0 end) as rk
  from m join g using (n)
  where m.n not in (9, 27, 44, 58, 73) and not m.is_inviter
),
base as (
  select m.id, m.n, m.signed_up, m.signup_platform, pl.city, pl.st, pl.lat, pl.lng,
         coalesce(o.rk > 12, true) as onboarded,
         case when m.n in (9, 58, 73) then 'job' when m.n = 27 then 'open' when m.n = 44 then 'both'
              when g.r_intent < 0.38 then 'job' when g.r_intent < 0.62 then 'open'
              when g.r_intent < 0.82 then 'both' else 'refer' end as intent,
         g.r_disc, g.r_years, g.r_relo, g.r_resume, g.r_tour, g.r_seen, g.r_seen2, g.r_emp, g.r_delay, g.r_loc
  from m
  join g using (n)
  left join onb o using (n)
  left join places pl on pl.area = substr(m.phone, 3, 3)
),
details as (
  select b.*,
         case when b.intent = 'refer' then null
              when b.r_disc < 0.20 then 'Electrical Engineer'
              when b.r_disc < 0.46 then 'Project Manager'
              when b.r_disc < 0.62 then 'Estimator'
              when b.r_disc < 0.76 then 'Superintendent'
              when b.r_disc < 0.95 then 'Foreman / Electrician'
              else 'Executive (VP / C-suite)' end as discipline,
         case when b.intent = 'refer' then
              (array['I work in construction', 'I''m a recruiter or in HR', 'I have friends in the trades',
                     'Just here to refer friends and earn'])[1 + floor(b.r_disc * 4)::int] end as connection,
         least(
           b.signed_up + case when b.r_delay < 0.82 then (2 + b.r_delay * 8) * interval '1 minute'
                              when b.r_delay < 0.94 then (1 + (b.r_delay - 0.82) * 200) * interval '1 hour'
                              else (1 + (b.r_delay - 0.94) * 60) * interval '1 day' end,
           now() - interval '10 minutes'
         ) as completed_at
  from base b
),
final as (
  select d.*,
         case when d.intent = 'refer' then null
              when d.discipline like 'Executive%' then case when d.r_years < 0.5 then '16–20' else '20+' end
              when d.r_years < 0.08 then '0–2'
              when d.r_years < 0.27 then '3–5'
              when d.r_years < 0.55 then '6–10'
              when d.r_years < 0.77 then '11–15'
              when d.r_years < 0.90 then '16–20'
              else '20+' end as years_band,
         -- the refer-only quiz does not ask for a city; some add one to their profile later
         (d.intent <> 'refer' or d.r_loc < 0.4) as has_loc,
         case when d.intent = 'refer' then null
              when d.r_relo < 0.22 then 'yes' when d.r_relo < 0.55 then 'maybe' else 'no' end as relocation,
         case when d.intent = 'open' then (
                select coalesce(array_agg(mv.m order by mv.ord), '{}'::text[])
                from unnest(array['Higher pay', 'A bigger title', 'Better projects', 'Better leadership',
                                  'Work-life balance', 'Closer to home', 'More stability']) with ordinality as mv(m, ord)
                where ('x' || substr(md5(d.n::text || mv.m), 1, 2))::bit(8)::int < 85)
              else '{}'::text[] end as motivators,
         case when d.intent = 'open' and d.r_emp < 0.8 then
              (array['Baywater Electric', 'Tri-County Power Systems', 'Summit Ridge Electrical',
                     'Coastal Current Contractors', 'Ironwood Mechanical & Electric', 'Blue Heron Constructors',
                     'Palmetto Line Electric', 'Lone Oak Power Group', 'Keystone Arc Electric', 'Gulfside Controls',
                     'Redfield Builders', 'Northgate Energy Services'])[1 + floor(d.r_emp / 0.8 * 12)::int] end as employer,
         (d.intent <> 'refer'
          and d.r_resume < case d.intent when 'job' then 0.72 when 'both' then 0.60 else 0.34 end) as has_resume
  from details d
)
update public.profiles pr set
  created_at = f.signed_up,
  metadata = pr.metadata || '{"demo": true, "seed": "admin_demo_v1"}'::jsonb,
  onboarded = f.onboarded,
  role = case when f.onboarded and f.intent <> 'refer' then 'candidate'::public.user_role
              else 'referral_partner'::public.user_role end,
  intent = case when f.onboarded then f.intent end,
  career_status = case when not f.onboarded then null
                       when f.intent = 'open' then 'open_to_offers'
                       when f.intent = 'refer' then 'not_looking'
                       else 'actively_looking' end,
  discipline = case when f.onboarded then f.discipline end,
  years_experience = case when f.onboarded then f.years_band end,
  location_city = case when f.onboarded and f.has_loc then f.city end,
  location_state = case when f.onboarded and f.has_loc then f.st end,
  location_lat = case when f.onboarded and f.has_loc then f.lat end,
  location_lng = case when f.onboarded and f.has_loc then f.lng end,
  relocation = case when f.onboarded then f.relocation end,
  move_motivators = case when f.onboarded then f.motivators else '{}'::text[] end,
  current_employer = case when f.onboarded then f.employer end,
  -- no file behind this path; it only marks "has a resume" for the dashboards
  resume_path = case when f.onboarded and f.has_resume then f.id::text || '/demo-resume.pdf' end,
  resume_uploaded_at = case when f.onboarded and f.has_resume then f.completed_at end,
  onboarding_answers = case when not f.onboarded then '{}'::jsonb
    when f.intent = 'refer' then jsonb_build_object('intent', f.intent, 'connection', f.connection, 'move_motivators', '[]'::jsonb)
    else jsonb_strip_nulls(jsonb_build_object(
      'intent', f.intent, 'discipline', f.discipline, 'years_experience', f.years_band,
      'location_city', f.city, 'location_state', f.st, 'location_lat', f.lat, 'location_lng', f.lng,
      'relocation', f.relocation, 'move_motivators', to_jsonb(f.motivators), 'current_employer', f.employer,
      'resume_path', case when f.has_resume then f.id::text || '/demo-resume.pdf' end,
      'resume_choice', case when f.has_resume then 'upload' else 'skip' end)) end,
  onboarding_completed_at = case when f.onboarded then f.completed_at end,
  tour_completed_at = case when f.onboarded and f.r_tour < 0.8
                           then least(f.completed_at + (1 + f.r_tour * 3) * interval '1 minute', now() - interval '5 minutes') end,
  last_seen_at = case
    when not f.onboarded then f.signed_up + f.r_seen2 * interval '20 minutes'
    when f.r_seen < 0.5 then greatest(f.completed_at, now() - f.r_seen2 * interval '6 days')
    else f.completed_at + f.r_seen2 * greatest(now() - interval '8 days' - f.completed_at, interval '0') end,
  last_platform = case when f.r_seen2 < 0.85 then f.signup_platform
                       when f.signup_platform = 'web' then 'ios' else 'web' end
from final f
where pr.id = f.id;


-- ═══ STEP 5: candidate records for the 58 onboarded job seekers ══════
-- Same fields complete_onboarding() copies. The routing trigger assigns owners.
insert into public.candidates (
  id, user_id, first_name, last_name, email, phone, location_city, location_state, location_lat, location_lng,
  current_job_title, current_company, trade, career_status, relocation, move_motivators, is_confidential,
  resume_path, source_type, status, metadata, created_at, updated_at
)
select md5('ecrn-demo-seed-candidate-' || pr.id)::uuid, pr.id,
       coalesce(pr.first_name, 'Member'), coalesce(pr.last_name, ''),
       lower(pr.email), pr.phone, pr.location_city, pr.location_state, pr.location_lat, pr.location_lng,
       pr.discipline, pr.current_employer, pr.discipline, pr.career_status, pr.relocation, pr.move_motivators,
       pr.career_status = 'open_to_offers', pr.resume_path, 'self_signup', 'new',
       jsonb_build_object('years_experience_band', pr.years_experience, 'demo', true, 'seed', 'admin_demo_v1'),
       pr.onboarding_completed_at, pr.onboarding_completed_at
from public.profiles pr
where pr.metadata->>'seed' = 'admin_demo_v1' and pr.onboarded and pr.intent in ('job', 'open', 'both')
order by pr.onboarding_completed_at;

-- routing happened "now"; move it back to just after each person finished onboarding
update public.candidates c
set routed_at = c.created_at + interval '2 seconds'
where c.metadata->>'seed' = 'admin_demo_v1' and c.source_type = 'self_signup' and c.routed_at is not null;

-- complete_onboarding() normally writes this activity row
insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata, created_at)
select pr.id, 'profile', pr.id, 'onboarding_completed',
       jsonb_build_object('intent', pr.intent, 'career_status', pr.career_status, 'candidate_id', c.id, 'demo', true),
       pr.onboarding_completed_at
from public.profiles pr
left join public.candidates c on c.user_id = pr.id
where pr.metadata->>'seed' = 'admin_demo_v1' and pr.onboarded;


-- ═══ STEP 6: 45 referred candidates from 15 members ══════════════════
-- Candidates, their primary referrals, job referrals for about half, then the
-- final pipeline status (set with an UPDATE so the placement trigger fires).
select setseed(0.4203);

with cities(ord, city, st, area, w) as (values
  ( 1, 'Tampa',           'FL', '813', 9), ( 2, 'Orlando',         'FL', '407', 7), ( 3, 'Miami',       'FL', '305', 5),
  ( 4, 'Jacksonville',    'FL', '904', 5), ( 5, 'St. Petersburg',  'FL', '727', 4), ( 6, 'Fort Lauderdale', 'FL', '954', 3),
  ( 7, 'Sarasota',        'FL', '941', 2), ( 8, 'Lakeland',        'FL', '863', 2), ( 9, 'Fort Myers',  'FL', '239', 1),
  (10, 'Tallahassee',     'FL', '850', 1), (11, 'West Palm Beach', 'FL', '561', 1), (12, 'Atlanta',     'GA', '404', 6),
  (13, 'Savannah',        'GA', '912', 2), (14, 'Charlotte',       'NC', '704', 4), (15, 'Raleigh',     'NC', '919', 3),
  (16, 'Charleston',      'SC', '843', 3), (17, 'Greenville',      'SC', '864', 2), (18, 'Houston',     'TX', '713', 6),
  (19, 'Dallas',          'TX', '214', 5), (20, 'Austin',          'TX', '512', 3), (21, 'San Antonio', 'TX', '210', 1)
),
city_slots as (
  select row_number() over (order by c.ord, s.i) as slot, c.city, c.st, c.area
  from cities c cross join lateral generate_series(1, c.w) as s(i)
),
titles(idx, title, trade) as (values
  ( 1, 'Journeyman Electrician',     'electrical'),  ( 2, 'Electrical Project Manager', 'electrical'),
  ( 3, 'Senior Estimator',           'electrical'),  ( 4, 'Electrical Superintendent',  'electrical'),
  ( 5, 'Electrical Foreman',         'electrical'),  ( 6, 'Project Engineer',           'electrical'),
  ( 7, 'Service Electrician',        'electrical'),  ( 8, 'Controls Engineer',          'electrical'),
  ( 9, 'Assistant Project Manager',  'electrical'),  (10, 'Low Voltage Technician',     'low_voltage'),
  (11, 'Fire Alarm Project Manager', 'low_voltage'), (12, 'Mechanical Project Manager', 'mechanical'),
  (13, 'HVAC Superintendent',        'mechanical'),  (14, 'Construction Superintendent', 'general_construction')
),
referrers as (
  -- 15 of the members who came to refer (or both), longest-standing first
  select x.id, x.completed_at, row_number() over (order by x.completed_at) as r
  from (
    select pr.id, pr.onboarding_completed_at as completed_at,
           row_number() over (order by pr.onboarding_completed_at) as pos
    from public.profiles pr
    where pr.metadata->>'seed' = 'admin_demo_v1' and pr.onboarded and pr.intent in ('refer', 'both')
  ) x
  where x.pos <= 10 or x.pos in (13, 15, 17, 19, 21)
),
slots as (
  select row_number() over (order by rf.r, s.i) as k, rf.id as referrer_id, rf.r, s.i, c.cnt,
         rf.completed_at + interval '1 day' as win_start
  from referrers rf
  cross join lateral (select (array[9, 6, 5, 4, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1])[rf.r] as cnt) c
  cross join lateral generate_series(1, c.cnt) as s(i)
),
g as materialized (
  select k, random() as r_pos, random() as r_email, random() as r_loc, random() as r_city, random() as r_title,
         random() as r_co, random() as r_years, random() as r_src, random() as r_note, random() as r_stat,
         random() as r_job
  from generate_series(1, 45) as k
),
timed as (
  select *,
         s.win_start + ((s.i - 0.75 + 0.5 * g.r_pos) / s.cnt) * (now() - interval '6 hours' - s.win_start) as created_at
  from slots s join g using (k)
),
ranked as (
  -- five early referrals from the four longest-standing referrers end up placed; the rest advance roughly by age
  select t.*,
         case when (t.r, t.i) in ((1, 1), (1, 2), (2, 1), (3, 1), (4, 1)) then 0
              else row_number() over (
                     partition by ((t.r, t.i) in ((1, 1), (1, 2), (2, 1), (3, 1), (4, 1)))
                     order by extract(epoch from now() - t.created_at) * (0.7 + 0.6 * t.r_stat) desc)
         end as srank
  from timed t
),
statused as (
  select rk.*,
         case when rk.srank = 0 then 'placed'
              when rk.srank <= 2 then 'offer_stage'
              when rk.srank <= 6 then 'interviewing'
              when rk.srank <= 10 then 'submitted_to_job'
              when rk.srank = 11 then 'rejected'
              when rk.srank = 12 then 'not_qualified'
              when rk.srank <= 18 then 'qualified'
              when rk.srank <= 28 then 'contacted'
              else 'new' end as final_status
  from ranked rk
),
plan as (
  select st.*,
         case when st.final_status in ('placed', 'offer_stage', 'interviewing', 'submitted_to_job', 'rejected')
                then case when st.r_src < 0.55 then 'job_link' when st.r_src < 0.85 then 'manual' else 'contacts' end
              when st.r_job < 0.30 then 'job_link'
              when st.r_src < 0.55 then 'manual'
              else 'contacts' end as source,
         (array['Aiden','Brianna','Caleb','Danielle','Elijah','Fatima','Gavin','Hannah','Isaac','Jocelyn',
                'Keith','Lauren','Mateo','Naomi','Omar','Paige','Quentin','Rosa','Sean','Tessa',
                'Ulises','Valerie','Wyatt','Ximena','Yusuf','Zoe','Andre','Bethany','Curtis','Delia',
                'Emmett','Faith','Gerald','Holly','Ivan','Jenna','Kofi','Leah','Miles','Nora'])[1 + (7 * (200 + st.k) + 3) % 40] as first_name,
         (array['Abbott','Barrera','Calloway','Dempsey','Eastman','Fontaine','Gallagher','Hargrove','Ibarra','Jennings',
                'Kowalski','Lachance','Mercer','Nakamura','Okafor','Pruitt','Quinlan','Rosario','Sandoval','Thibodeaux',
                'Underwood','Valdez','Whitaker','Yates','Zamora','Ashby','Bellamy','Crenshaw','Driscoll','Easley',
                'Fairchild','Granger','Holcomb','Irving','Jaramillo','Kessler','Lombardi','Maddox','Norwood','Ochoa',
                'Pemberton'])[1 + (11 * (200 + st.k) + 5) % 41] as last_name,
         cs.city, cs.st, cs.area, tt.title, tt.trade
  from statused st
  join city_slots cs on cs.slot = 1 + floor(st.r_city * 75)::int
  join titles tt on tt.idx = 1 + floor(st.r_title * 14)::int
),
located as (
  select p.*,
         -- contact imports usually arrive with a name, phone and title but no city
         (case when p.source = 'contacts' then p.r_loc < 0.70 else p.r_loc < 0.08 end) as no_loc,
         pl.lat, pl.lng
  from plan p
  left join lateral (
    select u.lat, u.lng from public.us_places u
    where u.name = p.city and u.state = p.st
    order by (u.kind = 'city') desc, u.land_sqmi desc nulls last
    limit 1
  ) pl on true
)
insert into public.candidates (
  id, first_name, last_name, email, phone, location_city, location_state, location_lat, location_lng,
  current_job_title, current_company, trade, years_experience, notes,
  source_type, primary_referrer_user_id, status, metadata, created_at, updated_at
)
select md5('ecrn-demo-seed-referred-' || p.k)::uuid, p.first_name, p.last_name,
       case when p.r_email < 0.72 then lower(p.first_name || '.' || p.last_name) || '@example.com' end,
       '+1' || p.area || '555' || lpad((200 + p.k)::text, 4, '0'),
       case when not p.no_loc then p.city end,
       case when not p.no_loc then p.st end,
       case when not p.no_loc then p.lat end,
       case when not p.no_loc then p.lng end,
       p.title,
       case when p.r_co < 0.6 then
         (array['Baywater Electric', 'Tri-County Power Systems', 'Summit Ridge Electrical',
                'Coastal Current Contractors', 'Ironwood Mechanical & Electric', 'Blue Heron Constructors',
                'Palmetto Line Electric', 'Lone Oak Power Group', 'Keystone Arc Electric', 'Gulfside Controls',
                'Redfield Builders', 'Northgate Energy Services'])[1 + floor(p.r_co / 0.6 * 12)::int] end,
       p.trade,
       2 + floor(p.r_years * 24)::int,
       case when p.r_note < 0.35 then
         (array['Worked together on a hospital project. Runs a tight crew.',
                'Former coworker. Ready to move up.',
                'Ran my crew for two years. Solid and reliable.',
                'Friend from trade school. Looking for better projects.',
                'Estimated alongside me for three years.',
                'Great with clients. Open to relocating.'])[1 + floor(p.r_note / 0.35 * 6)::int] end,
       'referred', p.referrer_id, 'new',
       -- seed_plan_* are scratch values, removed again at the end of this step
       jsonb_build_object('demo', true, 'seed', 'admin_demo_v1',
                          'seed_plan_status', p.final_status, 'seed_plan_source', p.source),
       p.created_at, p.created_at
from located p
order by p.created_at;

-- the referral rows (status already at its final value; the candidate catches up below)
insert into public.referrals (
  id, candidate_id, referrer_user_id, referral_source, status, is_primary, duplicate_status, notes, metadata,
  created_at, updated_at
)
select md5('ecrn-demo-seed-referral-' || c.id)::uuid, c.id, c.primary_referrer_user_id,
       c.metadata->>'seed_plan_source',
       (c.metadata->>'seed_plan_status')::public.referral_status, true, 'unique', c.notes,
       jsonb_build_object('demo', true, 'seed', 'admin_demo_v1', 'submitted', jsonb_strip_nulls(jsonb_build_object(
         'first_name', c.first_name, 'last_name', c.last_name, 'phone', c.phone, 'email', c.email,
         'current_job_title', c.current_job_title, 'current_company', c.current_company,
         'location_city', c.location_city, 'location_state', c.location_state, 'trade', c.trade,
         'years_experience', c.years_experience, 'notes', c.notes, 'source', c.metadata->>'seed_plan_source'))),
       c.created_at, c.created_at
from public.candidates c
where c.metadata->>'seed' = 'admin_demo_v1' and c.source_type = 'referred' and c.metadata ? 'seed_plan_status'
order by c.created_at;

-- about half are tied to one of the six jobs (every job-link referral, and everyone far enough along)
insert into public.job_referrals (
  id, job_id, candidate_id, referrer_user_id, status, notes, metadata, created_at, updated_at
)
select md5('ecrn-demo-seed-jobref-' || c.id)::uuid, j.id, c.id, c.primary_referrer_user_id,
       case when r.status = 'new' then 'submitted_to_job'::public.referral_status else r.status end,
       c.notes, '{"demo": true, "seed": "admin_demo_v1"}'::jsonb,
       c.created_at + interval '1 second', c.created_at + interval '1 second'
from public.candidates c
join public.referrals r on r.candidate_id = c.id and r.is_primary
join public.jobs j on j.title = case
       when c.trade = 'low_voltage' then 'Low Voltage Project Manager'
       when c.trade = 'mechanical' then 'Mechanical Project Manager'
       when c.trade = 'general_construction' then 'Construction Superintendent — Healthcare'
       when c.current_job_title = 'Senior Estimator' then 'Electrical Estimator'
       when c.current_job_title in ('Electrical Project Manager', 'Electrical Superintendent', 'Controls Engineer')
         then 'Senior Electrical Project Manager'
       else 'Assistant Project Manager — Electrical' end
where c.metadata->>'seed' = 'admin_demo_v1' and c.source_type = 'referred' and c.metadata ? 'seed_plan_status'
  and (r.referral_source = 'job_link'
       or r.status in ('placed', 'offer_stage', 'interviewing', 'submitted_to_job', 'rejected'))
order by c.created_at;

-- move each candidate to its final status with an UPDATE so the placement trigger creates the payouts
update public.candidates c
set status = (c.metadata->>'seed_plan_status')::public.referral_status,
    metadata = c.metadata - 'seed_plan_status' - 'seed_plan_source'
where c.metadata->>'seed' = 'admin_demo_v1' and c.source_type = 'referred' and c.metadata ? 'seed_plan_status';

update public.candidates c
set routed_at = c.created_at + interval '2 seconds'
where c.metadata->>'seed' = 'admin_demo_v1' and c.source_type = 'referred' and c.routed_at is not null;


-- ═══ STEP 7: 30 job applications from 24 seeded job seekers ══════════
select setseed(0.4204);

with seekers as (
  select c.id as candidate_id, pr.id as user_id, pr.discipline, pr.intent,
         pr.onboarding_completed_at as completed_at,
         split_part(split_part(pr.email, '@', 1), '.', 2)::int as n
  from public.profiles pr
  join public.candidates c on c.user_id = pr.id
  where pr.metadata->>'seed' = 'admin_demo_v1' and c.metadata->>'seed' = 'admin_demo_v1'
    -- the five members outside every territory never apply, so they stay in the unassigned queue
    and split_part(split_part(pr.email, '@', 1), '.', 2)::int not in (9, 27, 44, 58, 73)
),
g as materialized (
  select s.*, random() as r_pick, random() as r_two, random() as r_job, random() as r_time,
         random() as r_stat, random() as r_stat2, random() as r_note
  from (select * from seekers order by n) s
),
applicants as (
  select x.*, row_number() over (order by x.r_two) as two_rank
  from (
    select g.*, row_number() over (
             order by g.r_pick / case g.intent when 'job' then 0.60 when 'both' then 0.50 else 0.15 end) as pick_rank
    from g
  ) x
  where x.pick_rank <= 24
),
prefs(discipline, jobs) as (values
  ('Electrical Engineer',      array['Assistant Project Manager — Electrical', 'Senior Electrical Project Manager', 'Low Voltage Project Manager']),
  ('Project Manager',          array['Senior Electrical Project Manager', 'Mechanical Project Manager', 'Low Voltage Project Manager', 'Assistant Project Manager — Electrical']),
  ('Estimator',                array['Electrical Estimator', 'Assistant Project Manager — Electrical']),
  ('Superintendent',           array['Construction Superintendent — Healthcare', 'Senior Electrical Project Manager']),
  ('Foreman / Electrician',    array['Assistant Project Manager — Electrical', 'Construction Superintendent — Healthcare']),
  ('Executive (VP / C-suite)', array['Senior Electrical Project Manager', 'Construction Superintendent — Healthcare'])
),
apps as (
  select a.candidate_id, a.user_id, a.n, j.i as app_no,
         pf.jobs[1 + (floor(a.r_job * array_length(pf.jobs, 1))::int + j.i - 1) % array_length(pf.jobs, 1)] as job_title,
         -- most people apply soon after joining; a second application follows a few days later
         least(
           a.completed_at + interval '5 minutes'
             + power(a.r_time, 2) * greatest(now() - interval '2 hours' - a.completed_at, interval '0')
             + (j.i - 1) * (1 + a.r_two * 60) * interval '1 day',
           now() - interval '3 minutes' * (3 - j.i)
         ) as created_at,
         case when j.i = 1 then a.r_stat else a.r_stat2 end as r_stat,
         a.r_note
  from applicants a
  join prefs pf on pf.discipline = a.discipline
  cross join lateral generate_series(1, case when a.two_rank <= 6 then 2 else 1 end) as j(i)
),
ranked as (
  select ap.*, row_number() over (
           order by extract(epoch from now() - ap.created_at) * (0.6 + 0.8 * ap.r_stat) desc) as srank
  from apps ap
)
insert into public.job_applications (
  id, job_id, candidate_id, applicant_user_id, status, notes, metadata, created_at, updated_at
)
select md5('ecrn-demo-seed-application-' || r.user_id || '-' || j.id)::uuid, j.id, r.candidate_id, r.user_id,
       (case when r.srank <= 2 then 'hired'
             when r.srank <= 4 then 'offer'
             when r.srank <= 9 then 'interviewing'
             when r.srank <= 13 then 'rejected'
             when r.srank <= 21 then 'reviewing'
             else 'submitted' end)::public.application_status,
       case when r.app_no = 1 and r.r_note < 0.30 then
         (array['Available in two weeks.',
                'Open to travel. Licensed in Florida and Georgia.',
                'Ten years of commercial work. Looking for a larger program.',
                'Happy to talk any evening this week.',
                'Relocating to the area in January.'])[1 + floor(r.r_note / 0.30 * 5)::int] end,
       '{"demo": true, "seed": "admin_demo_v1"}'::jsonb,
       r.created_at, r.created_at
from ranked r
join public.jobs j on j.title = r.job_title
order by r.created_at;

-- account managers hand in-progress applications and job referrals to one of the job's recruiters
update public.job_applications a
set recruiter_id = (
  select jr.staff_id from public.job_recruiters jr
  where jr.job_id = a.job_id
  order by md5(jr.staff_id::text || a.id::text) limit 1)
where a.metadata->>'seed' = 'admin_demo_v1' and a.recruiter_id is null and a.status <> 'submitted';

update public.job_referrals r
set recruiter_id = (
  select jr.staff_id from public.job_recruiters jr
  where jr.job_id = r.job_id
  order by md5(jr.staff_id::text || r.id::text) limit 1)
where r.metadata->>'seed' = 'admin_demo_v1' and r.recruiter_id is null
  and r.status not in ('submitted_to_job', 'duplicate_review');

-- candidates who were re-routed to the job owner: put the routing time next to the application
update public.candidates c
set routed_at = x.first_applied + interval '2 seconds'
from (
  select a.candidate_id, min(a.created_at) as first_applied
  from public.job_applications a where a.metadata->>'seed' = 'admin_demo_v1' group by 1
) x
where c.id = x.candidate_id and c.routing_reason = 'job_owner' and c.metadata->>'seed' = 'admin_demo_v1';


-- ═══ STEP 8: pipeline status for the self-signup candidates + 5 manual hand-offs ═
select setseed(0.4205);

with app_best as (
  select a.candidate_id,
         max(case a.status when 'hired' then 6 when 'offer' then 5 when 'interviewing' then 4
                           when 'reviewing' then 3 when 'submitted' then 2 else 1 end) as best
  from public.job_applications a
  where a.metadata->>'seed' = 'admin_demo_v1'
  group by 1
),
others as materialized (
  -- job seekers who have an owner but have not applied to anything yet
  select o.id, o.created_at, random() as r
  from (
    select c.id, c.created_at
    from public.candidates c
    where c.metadata->>'seed' = 'admin_demo_v1' and c.source_type = 'self_signup'
      and c.account_manager_id is not null
      and not exists (select 1 from app_best b where b.candidate_id = c.id)
    order by c.created_at
  ) o
),
other_ranked as (
  select id, row_number() over (order by extract(epoch from now() - created_at) * (0.6 + 0.8 * r) desc) as rk
  from others
),
target as (
  select b.candidate_id as id,
         case b.best
           when 6 then 'placed'
           when 5 then 'offer_stage'
           when 4 then 'interviewing'
           when 3 then case when ('x' || substr(md5(b.candidate_id::text), 1, 2))::bit(8)::int < 100
                            then 'qualified' else 'contacted' end
           when 2 then 'new'
           else 'rejected' end as status
  from app_best b
  union all
  select r.id,
         case when r.rk <= 3 then 'qualified'
              when r.rk <= 11 then 'contacted'
              when r.rk = 12 then 'not_qualified'
              when r.rk = 13 then 'inactive'
              else 'new' end
  from other_ranked r
)
update public.candidates c
set status = t.status::public.referral_status
from target t
where c.id = t.id and c.status::text <> t.status;

-- five people with an account manager but no recruiter get one by hand (what admin_assign does)
with pick as (
  select c.id, c.routing_reason,
         row_number() over (partition by c.routing_reason
                            order by (c.status <> 'new') desc, md5('ecrn-demo-manual-' || c.id)) as rk
  from public.candidates c
  where c.metadata->>'seed' = 'admin_demo_v1' and c.recruiter_id is null
    and c.routing_reason in ('territory', 'job_owner')
)
update public.candidates c
set recruiter_id = (
      select s.id from public.staff s
      where s.manager_id = c.account_manager_id and s.is_active
      order by md5(s.id::text || c.id::text) limit 1),
    routing_reason = 'manual',
    routed_at = least(
      c.routed_at + interval '1 day' + (('x' || substr(md5(c.id::text), 1, 2))::bit(8)::int / 255.0) * interval '2 days',
      now() - interval '1 hour')
from pick p
where c.id = p.id
  and ((p.routing_reason = 'territory' and p.rk <= 3) or (p.routing_reason = 'job_owner' and p.rk <= 2));


-- ═══ STEP 9: history (activity log), payouts, duplicate attempts, hiring requests ═

-- 9.1 candidate pipeline history: one status_changed row per step
with paths(status, path) as (values
  ('contacted',        array['new', 'contacted']),
  ('qualified',        array['new', 'contacted', 'qualified']),
  ('submitted_to_job', array['new', 'contacted', 'qualified', 'submitted_to_job']),
  ('interviewing',     array['new', 'contacted', 'qualified', 'submitted_to_job', 'interviewing']),
  ('offer_stage',      array['new', 'contacted', 'qualified', 'submitted_to_job', 'interviewing', 'offer_stage']),
  ('placed',           array['new', 'contacted', 'qualified', 'submitted_to_job', 'interviewing', 'offer_stage', 'placed']),
  ('not_qualified',    array['new', 'contacted', 'not_qualified']),
  ('rejected',         array['new', 'contacted', 'qualified', 'submitted_to_job', 'interviewing', 'rejected']),
  ('inactive',         array['new', 'contacted', 'inactive'])
),
best_app as (
  -- for members who applied, the pipeline starts at the application that got furthest
  select distinct on (a.candidate_id) a.candidate_id, a.created_at
  from public.job_applications a
  where a.metadata->>'seed' = 'admin_demo_v1'
  order by a.candidate_id,
           case a.status when 'hired' then 6 when 'offer' then 5 when 'interviewing' then 4
                         when 'reviewing' then 3 when 'submitted' then 2 else 1 end desc,
           a.created_at
),
cand as (
  select c.id, c.status::text as status, c.source_type, coalesce(b.created_at, c.created_at) as base_at,
         row_number() over (partition by c.status, c.source_type order by c.created_at) as j
  from public.candidates c
  left join best_app b on b.candidate_id = c.id
  where c.metadata->>'seed' = 'admin_demo_v1' and c.status <> 'new'
),
stepped as (
  select cd.id, cd.base_at, p.path, array_length(p.path, 1) - 1 as m,
         greatest(interval '10 minutes', least(
           (now() - interval '2 hours' - cd.base_at) / (array_length(p.path, 1) - 0.5),
           case when cd.source_type = 'referred' and cd.status = 'placed'
                -- the first three placements move fast (about three weeks); the last two take six to seven weeks
                then (case when cd.j <= 3 then 3 + 0.4 * (cd.j - 1) else 6.5 + (cd.j - 4) end) * interval '1 day'
                else (3 + (('x' || substr(md5(cd.id::text), 1, 2))::bit(8)::int % 5) * 0.5) * interval '1 day' end
         )) as step
  from cand cd
  join paths p on p.status = cd.status
)
insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata, created_at)
select null, 'candidate', st.id, 'status_changed',
       jsonb_build_object('from', st.path[s.i], 'to', st.path[s.i + 1], 'demo', true),
       st.base_at + s.i * st.step
from stepped st
cross join lateral generate_series(1, st.m) as s(i);

-- 9.2 applications: submitted + each status step (paced like the candidate's own pipeline)
insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata, created_at)
select a.applicant_user_id, 'job_application', a.id, 'application_submitted',
       jsonb_build_object('job_id', a.job_id, 'candidate_id', a.candidate_id, 'demo', true), a.created_at
from public.job_applications a
where a.metadata->>'seed' = 'admin_demo_v1';

with trans(status, tos, mults) as (values
  ('reviewing',    array['reviewing'],                                   array[1]),
  ('interviewing', array['reviewing', 'interviewing'],                   array[1, 4]),
  ('offer',        array['reviewing', 'interviewing', 'offer'],          array[1, 4, 5]),
  ('hired',        array['reviewing', 'interviewing', 'offer', 'hired'], array[1, 4, 5, 6]),
  ('rejected',     array['reviewing', 'interviewing', 'rejected'],       array[1, 4, 5])
),
stepped as (
  select a.id, a.created_at, t.tos, t.mults,
         greatest(interval '10 minutes', least(
           (now() - interval '2 hours' - a.created_at) / (t.mults[array_length(t.mults, 1)] + 0.5),
           (3 + (('x' || substr(md5(a.candidate_id::text), 1, 2))::bit(8)::int % 5) * 0.5) * interval '1 day'
         )) as step
  from public.job_applications a
  join trans t on t.status = a.status::text
  where a.metadata->>'seed' = 'admin_demo_v1'
)
insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata, created_at)
select null, 'job_application', st.id, 'status_changed',
       jsonb_build_object('from', case when s.i = 1 then 'submitted' else st.tos[s.i - 1] end,
                          'to', st.tos[s.i], 'demo', true),
       st.created_at + st.mults[s.i] * st.step
from stepped st
cross join lateral generate_series(1, array_length(st.tos, 1)) as s(i);

-- 9.3 referrals: what submit_referral() would have logged
insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata, created_at)
select r.referrer_user_id, 'referral', r.id, 'referral_submitted',
       jsonb_build_object('candidate_id', r.candidate_id, 'job_id', jr.job_id, 'demo', true), r.created_at
from public.referrals r
left join public.job_referrals jr
  on jr.candidate_id = r.candidate_id and jr.referrer_user_id = r.referrer_user_id
 and jr.metadata->>'seed' = 'admin_demo_v1'
where r.metadata->>'seed' = 'admin_demo_v1' and r.is_primary;

insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata, created_at)
select jr.referrer_user_id, 'referral', r.id, 'referred_to_job',
       jsonb_build_object('job_id', jr.job_id, 'demo', true), jr.created_at
from public.job_referrals jr
join public.referrals r on r.candidate_id = jr.candidate_id and r.is_primary
where jr.metadata->>'seed' = 'admin_demo_v1';

-- 9.4 hand-offs: what admin_assign() would have logged
insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata, created_at)
select null, 'candidate', c.id, 'assigned',
       jsonb_build_object('account_manager_id', c.account_manager_id, 'recruiter_id', c.recruiter_id, 'demo', true),
       c.routed_at
from public.candidates c
where c.metadata->>'seed' = 'admin_demo_v1' and c.routing_reason = 'manual';

insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata, created_at)
select null, 'job_application', a.id, 'assigned',
       jsonb_build_object('account_manager_id', a.account_manager_id, 'recruiter_id', a.recruiter_id, 'demo', true),
       least(a.created_at + (4 + ('x' || substr(md5(a.id::text), 1, 2))::bit(8)::int % 30) * interval '1 hour',
             now() - interval '30 minutes')
from public.job_applications a
join public.candidates c on c.id = a.candidate_id
where a.metadata->>'seed' = 'admin_demo_v1' and a.recruiter_id is not null
  and a.recruiter_id is distinct from c.recruiter_id;

insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata, created_at)
select null, 'job_referral', jr.id, 'assigned',
       jsonb_build_object('account_manager_id', jr.account_manager_id, 'recruiter_id', jr.recruiter_id, 'demo', true),
       least(jr.created_at + (4 + ('x' || substr(md5(jr.id::text), 1, 2))::bit(8)::int % 30) * interval '1 hour',
             now() - interval '30 minutes')
from public.job_referrals jr
join public.candidates c on c.id = jr.candidate_id
where jr.metadata->>'seed' = 'admin_demo_v1' and jr.recruiter_id is not null
  and jr.recruiter_id is distinct from c.recruiter_id;

-- 9.5 payouts (created by the placement trigger): backdate to the placement, then 2 paid, 2 approved, 1 pending
with placed as (
  select p.id, al.created_at as placed_at, row_number() over (order by al.created_at) as j
  from public.payouts p
  join public.candidates c on c.id = p.candidate_id
  join public.activity_logs al
    on al.entity_type = 'candidate' and al.entity_id = c.id
   and al.action = 'status_changed' and al.metadata->>'to' = 'placed'
  where c.metadata->>'seed' = 'admin_demo_v1'
)
update public.payouts p
set status = (case when pl.j <= 2 then 'paid' when pl.j <= 4 then 'approved' else 'pending' end)::public.payout_status,
    placement_date = pl.placed_at::date,
    created_at = pl.placed_at,
    approved_at = case when pl.j <= 4 then pl.placed_at + interval '6 days' end,
    paid_at = case when pl.j <= 2 then pl.placed_at + interval '14 days' end,
    notes = case when pl.j = 1 then 'Paid by check.'
                 when pl.j = 2 then 'Paid by ACH.'
                 when pl.j <= 4 then 'Approved. Releases after the guarantee window.' end,
    metadata = p.metadata || '{"demo": true, "seed": "admin_demo_v1"}'::jsonb
from placed pl
where p.id = pl.id;

insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata, created_at)
select null::uuid, 'payout', p.id, 'status_changed',
       jsonb_build_object('from', 'pending', 'to', 'approved', 'amount_cents', p.amount_cents, 'demo', true), p.approved_at
from public.payouts p
where p.metadata->>'seed' = 'admin_demo_v1' and p.approved_at is not null
union all
select null::uuid, 'payout', p.id, 'status_changed',
       jsonb_build_object('from', 'approved', 'to', 'paid', 'amount_cents', p.amount_cents, 'demo', true), p.paid_at
from public.payouts p
where p.metadata->>'seed' = 'admin_demo_v1' and p.paid_at is not null;

-- 9.6 three duplicate attempts: a second member refers someone who is already in the network
with picks as (
  select c.id as candidate_id, c.primary_referrer_user_id, c.created_at, c.first_name, c.last_name,
         c.phone, c.email, c.current_job_title,
         row_number() over (order by md5('ecrn-demo-duplicate-' || c.id)) as rk
  from public.candidates c
  where c.metadata->>'seed' = 'admin_demo_v1' and c.source_type = 'referred'
    and c.created_at < now() - interval '6 days'
),
dups as (
  select pk.*, o.id as other_id,
         least(greatest(pk.created_at + interval '3 days', o.onboarding_completed_at + interval '1 day')
                 + pk.rk * interval '7 hours',
               now() - interval '3 hours') as dup_at
  from picks pk
  cross join lateral (
    select pr.id, pr.onboarding_completed_at
    from public.profiles pr
    where pr.metadata->>'seed' = 'admin_demo_v1' and pr.onboarded and pr.intent in ('refer', 'both')
      and pr.id <> pk.primary_referrer_user_id
      and pr.onboarding_completed_at < now() - interval '2 days'
    order by md5(pr.id::text || pk.candidate_id::text)
    limit 1
  ) o
  where pk.rk <= 3
)
insert into public.referrals (
  id, candidate_id, referrer_user_id, referral_source, status, is_primary, duplicate_status, notes, metadata,
  created_at, updated_at
)
select md5('ecrn-demo-seed-duplicate-' || d.candidate_id)::uuid, d.candidate_id, d.other_id,
       case when d.rk = 2 then 'contacts' else 'manual' end,
       'duplicate_review', false, 'pending_review', null,
       jsonb_build_object(
         'demo', true, 'seed', 'admin_demo_v1',
         'duplicate_reason', case when d.email is not null then 'email' else 'phone' end,
         'submitted', jsonb_strip_nulls(jsonb_build_object(
           'first_name', d.first_name, 'last_name', d.last_name, 'phone', d.phone, 'email', d.email,
           'current_job_title', d.current_job_title,
           'source', case when d.rk = 2 then 'contacts' else 'manual' end))),
       d.dup_at, d.dup_at
from dups d;

insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata, created_at)
select r.referrer_user_id, 'referral', r.id, 'duplicate_detected',
       jsonb_build_object('candidate_id', r.candidate_id, 'reason', r.metadata->>'duplicate_reason',
                          'job_id', null, 'demo', true),
       r.created_at
from public.referrals r
where r.metadata->>'seed' = 'admin_demo_v1' and not r.is_primary;

-- 9.7 six hiring requests from fictional contractors
insert into public.company_leads (
  id, company_name, contact_name, email, phone, location, role_needed, number_of_candidates, start_date,
  compensation_range, job_description, urgency, status, notes, metadata, created_at, updated_at
)
select md5('ecrn-demo-seed-lead-' || v.ord)::uuid, v.company_name, v.contact_name, v.email, v.phone, v.location,
       v.role_needed, v.num, (now() + v.start_in * interval '1 day')::date, v.comp, v.descr,
       v.urgency::public.job_urgency, v.status::public.company_lead_status, v.notes,
       '{"demo": true, "seed": "admin_demo_v1"}'::jsonb,
       now() - v.days_ago * interval '1 day' - interval '3 hours',
       now() - v.days_ago * interval '1 day' - interval '3 hours'
from (values
  (1, 'Harborline Electric', 'Paul Reddick', 'preddick@harborline-electric.example', '+18135550181', 'Tampa, FL',
      'Journeyman Electricians', 6, 21, '$34 to $42 per hour',
      'Crew for a 14-month hospital expansion. Conduit, wire pulls and terminations. Per diem for travelers.',
      'high', 'new', null, 3),
  (2, 'Brightwire Electrical Contractors', 'Monica Hale', 'mhale@brightwire-electrical.example', '+14075550182', 'Orlando, FL',
      'Electrical Project Manager', 1, 30, '$120,000 to $145,000',
      'Project manager for ground-up commercial work, $8M to $20M electrical scope.',
      'normal', 'contacted', 'Spoke with Monica. Sending the agreement this week.', 12),
  (3, 'Palmetto Ridge Mechanical', 'Darnell Oakes', 'doakes@palmettoridge-mechanical.example', '+18435550183', 'Charleston, SC',
      'Mechanical Superintendent', 2, 45, '$105,000 to $130,000',
      'Two superintendents for healthcare and higher-ed mechanical projects.',
      'normal', 'qualified', 'Signed agreement on file. Waiting on job descriptions.', 24),
  (4, 'Ironbay Constructors', 'Stacy Lund', 'slund@ironbay-constructors.example', '+19045550184', 'Jacksonville, FL',
      'Senior Estimator', 1, 14, '$110,000 to $135,000',
      'Senior estimator for the preconstruction group. Hard-bid and negotiated work.',
      'critical', 'engaged', 'Three candidates sent. Interviews next week.', 37),
  (5, 'Lone Star Voltage Group', 'Ray Montoya', 'rmontoya@lonestar-voltage.example', '+17135550185', 'Houston, TX',
      'Low Voltage Project Manager', 2, 10, '$95,000 to $120,000',
      'Project managers for fire alarm, security and structured cabling.',
      'high', 'won', 'First placement started. Second search is open.', 52),
  (6, 'Cypress Point Power Systems', 'Elaine Truitt', 'etruitt@cypresspoint-power.example', '+14045550186', 'Atlanta, GA',
      'Electrical Foreman', 4, 28, '$38 to $46 per hour',
      'Foremen for data center fit-out work. Night shift premium.',
      'low', 'new', null, 1)
) as v(ord, company_name, contact_name, email, phone, location, role_needed, num, start_in, comp, descr,
       urgency, status, notes, days_ago);

insert into public.activity_logs (actor_user_id, entity_type, entity_id, action, metadata, created_at)
select null::uuid, 'company_lead', l.id, 'company_lead_submitted', '{"demo": true}'::jsonb, l.created_at
from public.company_leads l
where l.metadata->>'seed' = 'admin_demo_v1'
union all
select null::uuid, 'company_lead', l.id, 'status_changed',
       jsonb_build_object('from', 'new', 'to', l.status, 'demo', true),
       l.created_at + interval '2 days'
from public.company_leads l
where l.metadata->>'seed' = 'admin_demo_v1' and l.status <> 'new';


-- ═══ STEP 10: backdate trigger-written activity; nothing may reach Bullhorn ═

-- 10.1 account_created -> the sign-up time
update public.activity_logs al
set created_at = pr.created_at,
    metadata = al.metadata || '{"demo": true}'::jsonb
from public.profiles pr
where al.entity_type = 'profile' and al.entity_id = pr.id and al.action = 'account_created'
  and pr.metadata->>'seed' = 'admin_demo_v1';

-- 10.2 routed -> right after the sign-up / referral, or right after the application / job referral that caused it
update public.activity_logs al
set created_at = coalesce(
      (select min(x.created_at) + interval '2 seconds'
       from (
         select a.created_at from public.job_applications a
         where a.candidate_id = c.id and a.job_id = nullif(al.metadata->>'job_id', '')::uuid
         union all
         select jr.created_at from public.job_referrals jr
         where jr.candidate_id = c.id and jr.job_id = nullif(al.metadata->>'job_id', '')::uuid
       ) x),
      c.created_at + interval '2 seconds'),
    metadata = al.metadata || '{"demo": true}'::jsonb
from public.candidates c
where al.entity_type = 'candidate' and al.entity_id = c.id and al.action = 'routed'
  and c.metadata->>'seed' = 'admin_demo_v1';

-- 10.3 sync queue safety: every event the seed queued is marked skipped, so demo people are never sent anywhere
update public.integration_outbox o
set status = 'skipped', last_error = 'demo data'
where o.status = 'queued'
  and (
    (o.entity_type = 'candidate' and exists (
       select 1 from public.candidates c where c.id = o.entity_id and c.metadata->>'seed' = 'admin_demo_v1'))
    or (o.entity_type = 'referral' and exists (
       select 1 from public.referrals r where r.id = o.entity_id and r.metadata->>'seed' = 'admin_demo_v1'))
    or (o.entity_type = 'job_referral' and exists (
       select 1 from public.job_referrals jr where jr.id = o.entity_id and jr.metadata->>'seed' = 'admin_demo_v1'))
    or (o.entity_type = 'job_application' and exists (
       select 1 from public.job_applications a where a.id = o.entity_id and a.metadata->>'seed' = 'admin_demo_v1'))
    or (o.entity_type = 'profile' and exists (
       select 1 from public.profiles pr where pr.id = o.entity_id and pr.metadata->>'seed' = 'admin_demo_v1'))
    or (o.entity_type = 'company_lead' and exists (
       select 1 from public.company_leads l where l.id = o.entity_id and l.metadata->>'seed' = 'admin_demo_v1'))
    -- events on older rows that only exist because a demo team member became their owner
    or exists (
       select 1 from public.staff s
       where s.metadata->>'seed' = 'admin_demo_v1'
         and s.id::text in (o.payload->'owner'->>'ecrnId', o.payload->'recruiter'->>'ecrnId'))
  );

-- 10.4 give the skipped events believable dates too (the Integrations screen charts them by day)
update public.integration_outbox o
set created_at = x.at
from (
  select o2.id,
         case
           when o2.event_type = 'candidate.created' then c.created_at
           when o2.event_type = 'candidate.updated' and o2.payload->'candidate'->>'status' = 'new' then c.created_at + interval '2 seconds'
           when o2.event_type = 'candidate.updated' then coalesce(
                (select max(al.created_at) from public.activity_logs al
                 where al.entity_type = 'candidate' and al.entity_id = c.id and al.action = 'status_changed'
                   and al.metadata->>'to' = o2.payload->'candidate'->>'status'),
                c.routed_at, c.created_at)
           when o2.event_type = 'referral.created' then r.created_at
           when o2.event_type = 'job_referral.created' then jr.created_at
           when o2.event_type = 'job_referral.updated' and jr.metadata->>'seed' = 'admin_demo_v1'
             then least(jr.created_at + interval '1 day', now() - interval '20 minutes')
           when o2.event_type = 'application.created' then a.created_at
           when o2.event_type = 'application.assigned' and a.metadata->>'seed' = 'admin_demo_v1'
             then least(a.created_at + interval '1 day', now() - interval '20 minutes')
           when o2.event_type = 'member.onboarded' then pr.onboarding_completed_at
           when o2.event_type = 'company_lead.created' then l.created_at
         end as at
  from public.integration_outbox o2
  left join public.candidates c on o2.entity_type = 'candidate' and c.id = o2.entity_id
  left join public.referrals r on o2.entity_type = 'referral' and r.id = o2.entity_id
  left join public.job_referrals jr on o2.entity_type = 'job_referral' and jr.id = o2.entity_id
  left join public.job_applications a on o2.entity_type = 'job_application' and a.id = o2.entity_id
  left join public.profiles pr on o2.entity_type = 'profile' and pr.id = o2.entity_id
  left join public.company_leads l on o2.entity_type = 'company_lead' and l.id = o2.entity_id
  where o2.status = 'skipped' and o2.last_error = 'demo data'
) x
where o.id = x.id and x.at is not null;


-- ═══ Sanity checks (read-only) ═══════════════════════════════════════
-- select staff_role, count(*) from public.staff group by 1;
-- select signup_source, count(*) from public.profiles group by 1;
-- select status, count(*) from public.candidates group by 1;
-- select coalesce(routing_reason, '(unassigned)'), count(*) from public.candidates group by 1;
-- select status, count(*) from public.job_applications group by 1;
-- select status, count(*) from public.payouts group by 1;
-- select status, count(*) from public.integration_outbox group by 1;   -- must show no 'queued' demo rows
-- select private.demo_data_counts();
