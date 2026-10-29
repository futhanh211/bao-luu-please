/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Chỉ dùng cho chế độ LIVE khi demo localhost; KHÔNG commit file .env.local. */
  readonly VITE_GEMINI_API_KEY?: string;
  /** Tên model Gemini (ví dụ gemini-2.0-flash) — không hardcode trong code. */
  readonly VITE_GEMINI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
