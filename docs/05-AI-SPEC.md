# 05 · AI SPEC — AI ở đâu, làm gì, không làm gì

## 1. Nguyên tắc (cũng là câu chốt khi thuyết trình)
**"AI gợi ý — Rule quyết — Người ký."**
- AI giúp ở chỗ có **ngôn ngữ, tài liệu không cấu trúc, tóm tắt, soạn thảo**.
- Chỗ có **quy chế cố định** (T3, G1/G4) dùng **rule engine** — chính xác, kiểm toán được.
- Chỗ có **trách nhiệm pháp lý** (T4, T5, T9) là **người quyết**; AI chỉ đề xuất, log lại khi người ≠ AI.
- Ngoài phạm vi: AI không tự đổi trạng thái ca, không tự ký, không tự gửi thông báo mà không qua node tương ứng.

## 2. Năm điểm chạm AI
- **AI-1 · DocScan (trong T1):** đọc minh chứng + đơn → trích trường, kiểm tra minh chứng đúng loại với lý do, phát hiện bất thường, trả `confidence`. Quyết định `validity` do code: trường bắt buộc đủ (deterministic) **và** `evidenceOk` (AI, confidence ≥ 0.6). Bất thường mềm không chặn ca, chỉ chuyển sang cho CTSV.
- **AI-2 · Trợ lý sinh viên (chatbot):** trả lời thủ tục, hồ sơ, SLA, tiến độ ca dựa trên `knowledge-base.ts` + tóm tắt `caseState`. Không bịa quy chế; không biết thì nói không biết và chỉ sang Phòng CTSV.
- **AI-3 · Brief cho người duyệt (T4, T5):** tóm tắt ca, liệt kê điểm cần chú ý, `suggestedDecision` + lý do. Hiển thị là "AI đề xuất" tách khỏi con dấu.
- **AI-4 · Soạn thảo (T2, T7, T8):** viết lời nhắn trả hồ sơ (liệt kê thiếu gì), giải thích lý do từ chối + hướng xử lý, và đoạn "căn cứ" trong dự thảo quyết định. Phần trường dữ liệu (tên, MSSV, thời hạn) là **trộn mẫu deterministic**, AI chỉ viết văn.
- **AI-5 · Người dẫn chuyện (tùy chọn, Director):** một câu thuyết minh cho mỗi event dựa trên `node-captions`. Bản mock = lấy thẳng từ captions. Chỉ làm live nếu còn thời gian.

## 3. Provider adapter
```ts
interface AIProvider {
  mode: 'mock' | 'live'
  analyzeDocuments(input: DocScanInput): Promise<DocScanResult>        // AI-1
  chat(history: ChatMsg[], ctx: CaseSummary): Promise<string>          // AI-2
  reviewerBrief(role: 'advisor'|'ctsv', ctx: CaseSummary): Promise<ReviewerBrief> // AI-3
  draftText(kind: 'return'|'reject'|'decisionBasis', ctx: CaseSummary): Promise<string> // AI-4
}
```
- `index.ts` chọn provider: có `VITE_GEMINI_API_KEY` trong `.env.local` và người dùng bật LIVE → live; còn lại mock.
- Mọi call live bọc: timeout 4000ms, 1 lần thử lại tối đa, validate JSON; lỗi → trả kết quả mock cùng kịch bản và badge đổi "MOCK (fallback)".

### 3.1 Mock (mặc định, deterministic)
- Dữ liệu lấy từ `scenario.aiScript`: kết quả DocScan, brief cho Cố vấn/CTSV, câu trả lời mẫu, văn bản soạn.
- Độ trễ giả 700–1600ms + hiệu ứng gõ chữ để trông như AI thật.
- Chatbot mock: khớp từ khóa/intent đơn giản (hồ sơ cần gì, bao lâu, trạng thái, bị từ chối vì sao) + câu fallback lịch sự. Phải đủ tốt để demo 5–6 câu hỏi đã tập.

### 3.2 Live (tùy chọn)
- Gọi REST của Gemini (`generativelanguage.googleapis.com`) từ trình duyệt, chỉ dùng localhost. Key và tên model đọc từ `.env.local` (`VITE_GEMINI_API_KEY`, `VITE_GEMINI_MODEL`); **không hardcode tên model**, không commit `.env.local`.
- Yêu cầu JSON: dùng `responseMimeType: application/json` + hướng dẫn schema trong prompt; parse an toàn, thiếu trường → fallback.
- Minh chứng ở live: mặc định gửi **mô tả văn bản** của tờ minh chứng giả lập (nội dung HTML → text). Gửi ảnh chụp là stretch goal.
- Dữ liệu gửi đi chỉ là dữ liệu giả lập.

## 4. Kiểu dữ liệu
- `DocScanResult = { evidenceType: string, typeMatchesReason: boolean, extracted: Record<string,string>, anomalies: {field: string, issue: string, severity: 'low'|'medium'|'high'}[], confidence: number }`
- `ReviewerBrief = { summary: string, points: string[], suggestedDecision: 'confirm'|'decline'|'valid'|'invalid', rationale: string }`
- `CaseSummary` = form + validity + ruleResult + advisor/ctsv status + ngày giả lập (không chứa gì ngoài dữ liệu giả lập).

## 5. Prompt khung (live) — viết bằng tiếng Việt, giữ ngắn
**AI-1 system:** "Bạn là bộ đọc hồ sơ cho quy trình nghỉ học tạm thời của một trường đại học. Nhận: đơn sinh viên và nội dung các minh chứng. Nhiệm vụ: (1) xác định loại minh chứng, (2) cho biết có khớp lý do nghỉ không, (3) trích các trường chính, (4) liệt kê bất thường (ngày không hợp lý, tên không khớp, thiếu dấu/chữ ký…), (5) cho confidence 0–1. Chỉ trả về JSON đúng schema. Không suy đoán ngoài dữ liệu."
**AI-2 system:** "Bạn là trợ lý của Cổng thông tin sinh viên, trả lời ngắn gọn, thân thiện bằng tiếng Việt. Chỉ dựa vào TRI THỨC và TÌNH TRẠNG CA được cung cấp. Nếu không có trong tri thức, nói bạn không chắc và hướng dẫn liên hệ Phòng Công tác sinh viên. Không hứa kết quả xét duyệt."
**AI-3 system:** "Bạn hỗ trợ người duyệt hồ sơ (vai: {role}). Tóm tắt ca trong 2–3 câu, nêu tối đa 4 điểm cần chú ý, đề xuất quyết định kèm lý do. Nhấn mạnh quyết định cuối cùng thuộc về người duyệt. Chỉ trả JSON."
**AI-4 system:** "Soạn văn bản hành chính tiếng Việt lịch sự, rõ ràng, ngắn (≤ 120 từ) cho loại: {kind}. Dùng đúng dữ kiện được cung cấp, không thêm thông tin mới."

## 6. Cách hiện AI trên UI
- Mọi nội dung do AI tạo có nhãn "AI" + chấm màu (xanh dương) tách biệt khỏi con dấu/giấy tờ.
- Có trạng thái "đang đọc hồ sơ…" (T1), "AI đề xuất" (T4/T5) với nút Hỏi AI, và chat bên Bàn Sinh viên.
- Badge nguồn: `AI · MOCK` / `AI · LIVE` / `AI · MOCK (fallback)`.
- Log sự kiện ghi `ai.requested/ai.responded` để thấy AI chen vào đâu trong BPMN (T1, T2, T7, T8 và hỗ trợ T4/T5).

## 7. Lời thoại gợi ý khi thuyết trình
- "Máy làm việc máy: đối chiếu quy chế dùng rule engine, không dùng AI vì cần chính xác và kiểm toán được."
- "AI làm việc nhiều chữ: đọc minh chứng, tóm tắt, soạn thông báo. Người vẫn là người ký và chịu trách nhiệm."
- "Nếu AI lỗi, quy trình không dừng — có phương án dự phòng."
