-- ─────────────────────────────────────────────────────────────────────
-- ECRN — baseline data: admin allowlist + starter open jobs.
-- Demo accounts are created separately (supabase/seed_demo.sql) because
-- they need a password that must not live in the repo.
-- ─────────────────────────────────────────────────────────────────────

insert into public.admin_allowlist (email) values ('aaron@skyway.media')
on conflict do nothing;

insert into public.jobs (
  title, company_name, location_city, location_state, job_type, trade,
  description, requirements, compensation_min, compensation_max, compensation_display,
  urgency, status, is_public, referral_payout_amount, referral_payout_display
) values
(
  'Senior Electrical Project Manager', 'Confidential Top-ENR Electrical Contractor', 'Tampa', 'FL', 'Full-time', 'electrical',
  'Lead large-scale commercial electrical projects from preconstruction through closeout. Manage PMs, scheduling, budgets, and client relationships across $10M+ projects.',
  '8+ years electrical PM experience. Strong P&L ownership. Bluebeam / Procore proficiency.',
  130000, 165000, '$130–165K + bonus + vehicle', 'high', 'open', true, 500000, '$5,000'
),
(
  'Electrical Estimator', 'National Electrical Contractor', 'Orlando', 'FL', 'Full-time', 'electrical',
  'Estimate commercial and industrial electrical projects up to $25M. Work directly with senior leadership and project executives.',
  '5+ years estimating. Accubid or McCormick preferred. Strong takeoff skills.',
  95000, 130000, '$95–130K', 'normal', 'open', true, 350000, '$3,500'
),
(
  'Construction Superintendent — Healthcare', 'Confidential GC', 'Miami', 'FL', 'Full-time', 'general_construction',
  'Run field operations for ground-up healthcare projects. Coordinate subs, safety, schedule, and inspections.',
  '10+ years field experience, healthcare GC exposure required, OSHA 30.',
  120000, 155000, '$120–155K + per diem', 'critical', 'open', true, 1000000, '$10,000'
),
(
  'Mechanical Project Manager', 'Confidential MEP Contractor', 'St. Petersburg', 'FL', 'Full-time', 'mechanical',
  'Manage commercial HVAC and plumbing projects, $5–20M scope. Direct PM and APM teams.',
  '7+ years mechanical PM. PE preferred. Track record of profitable closeouts.',
  115000, 150000, '$115–150K + bonus', 'normal', 'open', true, 400000, '$4,000'
),
(
  'Assistant Project Manager — Electrical', 'Confidential Electrical Contractor', 'Tampa', 'FL', 'Full-time', 'electrical',
  'Support senior PMs on commercial electrical work: submittals, RFIs, change orders, and schedule updates.',
  '2+ years in electrical construction (field or office). Procore a plus.',
  75000, 95000, '$75–95K', 'normal', 'open', true, 200000, '$2,000'
),
(
  'Low Voltage Project Manager', 'Confidential Technology Integrator', 'Jacksonville', 'FL', 'Full-time', 'low_voltage',
  'Own structured cabling, security, and AV projects for commercial and healthcare clients.',
  '5+ years low-voltage PM experience. BICSI certification preferred.',
  100000, 125000, '$100–125K', 'high', 'open', true, 300000, '$3,000'
);
