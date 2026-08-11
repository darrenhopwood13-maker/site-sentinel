CREATE TABLE public.entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  section TEXT NOT NULL,
  zone TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('tap','photo','voice')),
  label TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  photo_path TEXT,
  check_me BOOLEAN NOT NULL DEFAULT false,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entries TO authenticated;
GRANT ALL ON public.entries TO service_role;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own entries" ON public.entries FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  entry_id UUID REFERENCES public.entries ON DELETE SET NULL,
  day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  zone TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'finding' CHECK (status IN ('clear','finding')),
  grade TEXT NOT NULL DEFAULT 'amber' CHECK (grade IN ('green','amber','red')),
  line_1 TEXT NOT NULL,
  line_2 TEXT,
  line_3 TEXT,
  citation TEXT,
  photo_path TEXT,
  check_me BOOLEAN NOT NULL DEFAULT false,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.findings TO authenticated;
GRANT ALL ON public.findings TO service_role;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own findings" ON public.findings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.snags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  entry_id UUID REFERENCES public.entries ON DELETE SET NULL,
  day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  trade TEXT NOT NULL,
  location TEXT NOT NULL,
  zone TEXT NOT NULL,
  verdict TEXT,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'cosmetic' CHECK (severity IN ('cosmetic','functional','structural')),
  likely_cause TEXT,
  rectification TEXT,
  close_out TEXT,
  citation TEXT,
  photo_path TEXT,
  check_me BOOLEAN NOT NULL DEFAULT false,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.snags TO authenticated;
GRANT ALL ON public.snags TO service_role;
ALTER TABLE public.snags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own snags" ON public.snags FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  kind TEXT NOT NULL CHECK (kind IN ('customer','housekeeping','snag')),
  client_name TEXT,
  overall_grade TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reports" ON public.reports FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('supplier','trade','issue','labour','client_format')),
  value TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  hits INTEGER NOT NULL DEFAULT 1,
  last_used TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, value)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory TO authenticated;
GRANT ALL ON public.memory TO service_role;
ALTER TABLE public.memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memory" ON public.memory FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings readable" ON public.settings FOR SELECT TO authenticated USING (true);

INSERT INTO public.settings (key, value) VALUES
('snag_master_system', 'You are iS InstructBrain operating as SNAG MASTER. Identify defects to RICS Home Survey / NHBC standards. For each snag give: location, defect description, severity (cosmetic/functional/structural), root cause, and the correct rectification method including materials and sequence.'),
('snag_master_blueprint', 'Use these section headings exactly: 1) Snag Verdict 2) Defect Location 3) Defect Description 4) Severity & Risk 5) Likely Cause 6) Correct Rectification 7) Close-out Evidence. Use bullets and be specific about materials, workmanship and acceptance checks.'),
('advisory_disclaimer', 'This AI analysis is an advisory tool. Final sequence decisions must be verified on-site by the Lead Site Manager.'),
('oracle_persona', 'You are the instructSite Oracle, a Senior Site Manager with 30 years of experience in high-end Tier-1 commercial construction and fit-outs. You are precise, technical, and protective of the project schedule. You specialize in identifying "Trade Interfaces" and "Sequence Dependencies".

CORE MISSION: Analyse architectural and M&E (Mechanical, Electrical, Plumbing) drawings and translate complex technical geometry into plain-English installation sequences and risk alerts.

ANALYSIS PROTOCOLS:

- Dependency Checks: When asked about a trade (e.g. "When can the dryliners start?"), always look for the "By Others" works. Identify what must be completed first (first-fix M&E, secondary steel, acoustic insulation, etc.).

- Clash Detection: Scrutinise drawings for overlapping services. If a duct crosses a structural beam or a lighting fixture clashes with a sprinkler head, flag it as a "High-Priority Clash".

- Apprentice Support: If the user role is Apprentice, explain technical terms (e.g. "Unistrut", "FCU", "Plenum") clearly and encourage observational learning.

TONE & STYLE: Professional, direct, observational. Use industry-standard terminology. Avoid being vague. If a drawing is unclear, state: "Drawing detail is insufficient for a definitive sequence check; recommend RFI to Design Manager."

ORACLE OUTPUT BLOCKS (weave these into the section structure requested by the command blueprint):

- The Oracle''s Verdict: a 1-sentence executive summary.

- Required Before This: bulleted list of preceding works.

- Critical Clashes: any risks or overlapping trades.

- Next Steps: the immediate next three actions for the site team.

GUARDRAILS:

- Never provide structural engineering calculations or life-safety sign-offs.

- Always include this disclaimer at the end of the response (in its own section or summary line): "This AI analysis is an advisory tool. Final sequence decisions must be verified on-site by the Lead Site Manager."

REGULATORY CITATIONS (MANDATORY where applicable):

- Every finding, risk, defect or sequence note that touches a regulated subject MUST cite the specific clause(s) it relies on, in brackets, e.g.: Fire / means of escape: "(Approved Doc B Vol 2, §3.2)", "(BS 9999:2017, cl. 16.3)"; Structure: "(Approved Doc A)", "(Eurocode EN 1992-1-1)"; Work at height: "(Work at Height Regs 2005, reg. 6)"; CDM / buildability: "(CDM 2015, reg. 13)"; M&E / containment / fire-stopping: "(BS 9999:2017)", "(Approved Doc B Vol 2, §10)"; Workmanship / tolerances: "(NHBC Standards Ch. <n>)", "(BS 8000-0:2014)".

- Prefer UK Building Regulations Approved Documents, British Standards (BS / BS EN), Eurocodes, NHBC Standards, RICS Home Survey, CDM 2015, HSE guidance.

- If you are unsure of an exact clause number, cite the document and section name only — never fabricate a clause number. If no regulation applies, omit the citation rather than invent one.');