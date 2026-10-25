-- ==============================================================================
-- SAHELI INDIA: FEEDBACK REPORTS & PUSH SUBSCRIPTIONS SCHEMA & RLS POLICIES
-- ==============================================================================
-- Provides durable database storage for in-app bug reports, feedback, and
-- discreet Web Push notification subscriptions.
-- ==============================================================================

-- 1. FEEDBACK & BUG REPORTS TABLE
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

-- 2. PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    discreet BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_notified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_push_endpoint ON public.push_subscriptions (endpoint);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Feedback Reports: Public can insert new feedback reports
CREATE POLICY "Public can submit feedback reports" ON public.feedback_reports
    FOR INSERT WITH CHECK (true);

-- Feedback Reports: Public can view report status by report ID
CREATE POLICY "Public can check own report status" ON public.feedback_reports
    FOR SELECT USING (true);

-- Push Subscriptions: Public can insert/update push subscription
CREATE POLICY "Public can manage push subscriptions" ON public.push_subscriptions
    FOR ALL USING (true) WITH CHECK (true);
