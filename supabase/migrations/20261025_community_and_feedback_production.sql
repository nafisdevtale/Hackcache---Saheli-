-- ==============================================================================
-- SAHELI INDIA: CONSOLIDATED PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- Tables: community_posts, community_replies, community_reports, feedback_reports
-- Security: Strict Row Level Security, no PII, child safeguarding, zero-trust author proof
-- ==============================================================================

-- 1. COMMUNITY POSTS
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_alias VARCHAR(50) NOT NULL,
    author_hash VARCHAR(64) NOT NULL,
    age_group VARCHAR(10) NOT NULL CHECK (age_group IN ('adult', 'under18')),
    topic VARCHAR(30) NOT NULL DEFAULT 'general' CHECK (topic IN ('cycles', 'pcos', 'first_period', 'hygiene', 'pain', 'general')),
    title VARCHAR(120) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    report_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_posts_feed ON public.community_posts (age_group, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.community_posts (author_hash);

-- 2. COMMUNITY REPLIES
CREATE TABLE IF NOT EXISTS public.community_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    author_alias VARCHAR(50) NOT NULL,
    author_hash VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    report_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_replies_post ON public.community_replies (post_id, status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_replies_author ON public.community_replies (author_hash);

-- 3. COMMUNITY REPORTS
CREATE TABLE IF NOT EXISTS public.community_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('post', 'reply')),
    target_id UUID NOT NULL,
    reason VARCHAR(200) NOT NULL,
    reporter_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reports_target ON public.community_reports (target_type, target_id);

-- 4. FEEDBACK & BUG REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.feedback_reports (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'bug', 'crash', 'cycle_calculation', 'translation', 'ai_assistant',
        'reminders', 'audio', 'privacy', 'accessibility', 'feature', 'general'
    )),
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    steps_to_reproduce TEXT,
    expected_behaviour TEXT,
    actual_behaviour TEXT,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    app_version VARCHAR(50),
    browser_info VARCHAR(200),
    contact VARCHAR(100),
    has_screenshot BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'under_review', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON public.feedback_reports (category);

-- 5. AUTO-FLAG TRIGGER (Hides post/reply if 3+ reports received)
CREATE OR REPLACE FUNCTION handle_auto_flag_report()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.target_type = 'post' THEN
        UPDATE public.community_posts
        SET report_count = report_count + 1,
            status = CASE WHEN report_count + 1 >= 3 THEN 'flagged' ELSE status END
        WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'reply' THEN
        UPDATE public.community_replies
        SET report_count = report_count + 1,
            status = CASE WHEN report_count + 1 >= 3 THEN 'flagged' ELSE status END
        WHERE id = NEW.target_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_flag_report ON public.community_reports;
CREATE TRIGGER trg_auto_flag_report
AFTER INSERT ON public.community_reports
FOR EACH ROW
EXECUTE FUNCTION handle_auto_flag_report();

-- 6. ROW LEVEL SECURITY (RLS) ACTIVATION
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;

-- Drop any legacy insecure policies if re-running
DROP POLICY IF EXISTS "Public can view approved posts" ON public.community_posts;
DROP POLICY IF EXISTS "Authors can view own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Public can submit posts" ON public.community_posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Public can view approved adult posts" ON public.community_posts;
DROP POLICY IF EXISTS "Public can submit pending adult posts" ON public.community_posts;

DROP POLICY IF EXISTS "Public can view approved replies" ON public.community_replies;
DROP POLICY IF EXISTS "Public can submit replies" ON public.community_replies;
DROP POLICY IF EXISTS "Authors can delete own replies" ON public.community_replies;
DROP POLICY IF EXISTS "Public can submit pending replies" ON public.community_replies;

DROP POLICY IF EXISTS "Anyone can submit reports" ON public.community_reports;
DROP POLICY IF EXISTS "Public can submit abuse reports" ON public.community_reports;

DROP POLICY IF EXISTS "Public can submit feedback reports" ON public.feedback_reports;
DROP POLICY IF EXISTS "Public can check own report status" ON public.feedback_reports;

-- 7. SECURE RLS POLICIES FOR COMMUNITY POSTS
-- Public/anon can ONLY view approved adult posts. Never pending, rejected, flagged, or under18.
CREATE POLICY "Public can view approved adult posts" ON public.community_posts
    FOR SELECT TO anon, authenticated
    USING (status = 'approved' AND age_group = 'adult');

-- Public/anon insertion: must be pending and adult (under18 forum disabled per DPDP Act)
CREATE POLICY "Public can submit pending adult posts" ON public.community_posts
    FOR INSERT TO anon, authenticated
    WITH CHECK (status = 'pending' AND age_group = 'adult');

-- Direct updates or deletions via public anon key are completely disabled.
-- Server-side endpoints verify author secrets and perform deletion via service_role.

-- 8. SECURE RLS POLICIES FOR COMMUNITY REPLIES
-- Public/anon can ONLY view approved replies
CREATE POLICY "Public can view approved replies" ON public.community_replies
    FOR SELECT TO anon, authenticated
    USING (status = 'approved');

-- Public/anon can only submit pending replies
CREATE POLICY "Public can submit pending replies" ON public.community_replies
    FOR INSERT TO anon, authenticated
    WITH CHECK (status = 'pending');

-- 9. SECURE RLS POLICIES FOR COMMUNITY REPORTS
-- Reports can be submitted by anon/authenticated, but CANNOT be read publicly.
CREATE POLICY "Public can submit abuse reports" ON public.community_reports
    FOR INSERT TO anon, authenticated
    WITH CHECK (target_type IN ('post', 'reply') AND length(reason) <= 200);

-- Zero public SELECT access to reports. Only service_role can read reports.

-- 10. SECURE RLS POLICIES FOR FEEDBACK REPORTS
-- Feedback reports can be submitted by anon/authenticated with received status.
CREATE POLICY "Public can submit feedback reports" ON public.feedback_reports
    FOR INSERT TO anon, authenticated
    WITH CHECK (status = 'received');

-- Zero public SELECT access to feedback reports.
-- Feedback status queries and maintainer views are strictly mediated by the Saheli server API
-- using the service_role key to prevent exposing user bug reports or contact info.
