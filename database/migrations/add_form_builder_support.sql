-- Migration: Form Builder & Submissions
-- Description: Create forms and form_submissions tables for external form signups
-- Date: 2025-11-15

-- ============================================
-- 1. Create forms table
-- ============================================
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE forms IS 'Stores dynamic forms configuration for external signups (fields, theme, embed settings).';
COMMENT ON COLUMN forms.form_key IS 'Public key used to identify the form when embedding or submitting.';
COMMENT ON COLUMN forms.config IS 'JSON configuration for fields, theme and embed settings.';

-- ============================================
-- 2. Create form_submissions table
-- ============================================
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  email TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE form_submissions IS 'Stores submissions for dynamic forms built in the admin form builder.';
COMMENT ON COLUMN form_submissions.data IS 'Raw submitted fields as JSON.';

CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_email ON form_submissions(email);

-- ============================================
-- 3. Basic grants (adjust RLS/policies as needed in Supabase UI)
-- ============================================
GRANT SELECT, INSERT ON forms TO authenticated;
GRANT SELECT, INSERT ON form_submissions TO authenticated;
GRANT SELECT, INSERT ON forms TO service_role;
GRANT SELECT, INSERT ON form_submissions TO service_role;
GRANT SELECT ON forms TO anon;

-- ============================================
-- 4. Row Level Security & Policies
-- ============================================
-- Enable RLS
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Public can read forms (for embed and public form pages)
CREATE POLICY "Public read forms"
ON forms
FOR SELECT
USING (true);

-- Only admins can create/update/delete forms
CREATE POLICY "Admins manage forms"
ON forms
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role = 'admin'
  )
);

-- Only admins can view submissions (via authenticated client)
CREATE POLICY "Admins read submissions"
ON form_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role = 'admin'
  )
);

-- Only admins can modify submissions (delete/manual edits if needed)
CREATE POLICY "Admins manage submissions"
ON form_submissions
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role = 'admin'
  )
);
