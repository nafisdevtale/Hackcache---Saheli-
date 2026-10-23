-- ==============================================================================
-- SAHELI INDIA: SAFE PSEUDONYMOUS COMMUNITY SCHEMA & RLS POLICIES
-- ==============================================================================
-- Designed for complete privacy, no PII, pseudonymous client-held credentials,
-- strict under-18 vs adult partition, pending moderation queue, and user data wiping.
-- ==============================================================================

-- 1. COMMUNITY POSTS
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_alias VARCHAR(50) NOT NULL,
    author_hash VARCHAR(64) NOT NULL, -- SHA-256 of device credential
    age_group VARCHAR(10) NOT NULL CHECK (age_group IN ('adult', 'under18')),
    topic VARCHAR(30) NOT NULL DEFAULT 'general' CHECK (topic IN ('cycles', 'pcos', 'first_period', 'hygiene', 'pain', 'general')),
    title VARCHAR(120) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    report_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indices for rapid feed queries and author lookups
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

-- 4. AUTO-FLAG TRIGGER (Hides post/reply if 3+ reports received)
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

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

-- Posts: Public can read approved posts
CREATE POLICY "Public can view approved posts" ON public.community_posts
    FOR SELECT USING (status = 'approved');

-- Posts: Author can view own posts (including pending)
CREATE POLICY "Authors can view own posts" ON public.community_posts
    FOR SELECT USING (author_hash = current_setting('request.headers', true)::json->>'x-author-hash');

-- Posts: Public can insert pending posts
CREATE POLICY "Public can submit posts" ON public.community_posts
    FOR INSERT WITH CHECK (status = 'pending');

-- Posts: Author can delete own posts
CREATE POLICY "Authors can delete own posts" ON public.community_posts
    FOR DELETE USING (author_hash = current_setting('request.headers', true)::json->>'x-author-hash');

-- Replies: Public can view approved replies
CREATE POLICY "Public can view approved replies" ON public.community_replies
    FOR SELECT USING (status = 'approved');

-- Replies: Public can submit pending replies
CREATE POLICY "Public can submit replies" ON public.community_replies
    FOR INSERT WITH CHECK (status = 'pending');

-- Replies: Author can delete own replies
CREATE POLICY "Authors can delete own replies" ON public.community_replies
    FOR DELETE USING (author_hash = current_setting('request.headers', true)::json->>'x-author-hash');

-- Reports: Anyone can submit a report
CREATE POLICY "Anyone can submit reports" ON public.community_reports
    FOR INSERT WITH CHECK (true);
