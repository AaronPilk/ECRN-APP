-- New candidate source for people who join ECRN themselves through onboarding.
-- (Enum values must be committed before they can be used, so this is its own migration.)
alter type public.candidate_source add value if not exists 'self_signup';
