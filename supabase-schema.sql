-- ====================================================================
--   BẢO LƯU, PLEASE — SUPABASE DATABASE SCHEMA & REALTIME SYNC
--   Mô phỏng quy trình To-Be Nghỉ học tạm thời / Bảo lưu kết quả học tập
--   (Trường ĐH Kinh tế – ĐH Đà Nẵng, BPMN 2.0)
-- ====================================================================

-- 1. Bảng lưu trữ hồ sơ nộp trực tuyến (submitted_cases)
CREATE TABLE IF NOT EXISTS public.submitted_cases (
  id TEXT PRIMARY KEY,
  case_code TEXT NOT NULL,
  student_mssv TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_class TEXT DEFAULT '',
  student_faculty TEXT DEFAULT '',
  student_phone TEXT,
  student_email TEXT,
  form JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  attached_evidence_ids JSONB DEFAULT '[]'::jsonb,
  submitted_at TEXT NOT NULL,
  day INT DEFAULT 0,
  status TEXT NOT NULL,
  advisor_decision TEXT,
  advisor_decision_at TEXT,
  advisor_notes TEXT,
  ctsv_decision TEXT,
  ctsv_decision_at TEXT,
  ctsv_marks JSONB DEFAULT '[]'::jsonb,
  ctsv_notes TEXT,
  principal_signed BOOLEAN DEFAULT false,
  principal_signed_at TEXT,
  principal_signer_name TEXT,
  decision_doc JSONB,
  log JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chỉ mục tối ưu tìm kiếm theo MSSV và Mã hồ sơ
CREATE INDEX IF NOT EXISTS idx_submitted_cases_student_mssv ON public.submitted_cases (student_mssv);
CREATE INDEX IF NOT EXISTS idx_submitted_cases_status ON public.submitted_cases (status);
CREATE INDEX IF NOT EXISTS idx_submitted_cases_updated_at ON public.submitted_cases (updated_at DESC);

-- 3. Kích hoạt tính năng Supabase Realtime (để push thông báo tức thì giữa các máy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'submitted_cases'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submitted_cases;
  END IF;
END $$;

-- 4. Phân quyền truy cập công khai cho bài thuyết trình (Row Level Security - RLS)
ALTER TABLE public.submitted_cases ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc dữ liệu (SELECT) cho mọi client ẩn danh (anon)
CREATE POLICY "Allow public select on submitted_cases"
  ON public.submitted_cases
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Cho phép thêm mới dữ liệu (INSERT)
CREATE POLICY "Allow public insert on submitted_cases"
  ON public.submitted_cases
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Cho phép cập nhật trạng thái phê duyệt (UPDATE)
CREATE POLICY "Allow public update on submitted_cases"
  ON public.submitted_cases
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Cho phép xóa hồ sơ khi nộp lại / reset (DELETE)
CREATE POLICY "Allow public delete on submitted_cases"
  ON public.submitted_cases
  FOR DELETE
  TO anon, authenticated
  USING (true);
