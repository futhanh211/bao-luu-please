# M6 · AI ĐẦY ĐỦ — PROMPT THI HÀNH

> Dán nguyên khối này vào session mới **sau khi M5 đã xong**. Không hỏi lại nếu không bị chặn hoàn toàn; gặp chỗ mơ hồ thì chọn phương án đơn giản nhất, ghi `ASSUMPTION:` vào `docs/PROGRESS.md`, rồi làm tiếp.

---

## 0. Câu mở đầu cho session mới

Đọc `AGENTS.md`, `docs/00-PROJECT-OVERVIEW.md`, `docs/01-PROCESS-SPEC.md`, `docs/04-ARCHITECTURE.md`, `docs/05-AI-SPEC.md`, `docs/06-ROADMAP.md`, `docs/PROGRESS.md` và file này. Thực hiện đúng **Milestone M6 · AI đầy đủ** theo checklist dưới đây. Không làm M7, không làm lại M5, không đổi topology BPMN. Dừng khi đạt Definition of Done và cập nhật `docs/PROGRESS.md` + tick `docs/06-ROADMAP.md`.

---

## 1. Mục tiêu M6 (nguyên văn roadmap)

- [ ] Hoàn thiện mock cho AI-1…AI-4 theo `aiScript` mỗi kịch bản; chatbot 6+ intent.
- [ ] Hiển thị chuẩn (nhãn AI, gõ chữ, badge nguồn); log `ai.*`.
- [ ] (Tùy chọn) provider live Gemini + fallback + công tắc LIVE.
- DoD: mọi điểm chạm AI hoạt động trên mock; tắt mạng vẫn chạy.

**Ưu tiên bắt buộc:** mock + hiển thị + log phải xong và test xanh trước. Live Gemini làm sau cùng; nếu live lỗi/không cấu hình được thì M6 vẫn đạt DoD, ghi rõ trong PROGRESS.

---

## 2. Preflight bắt buộc (làm trước khi sửa dòng code nào)

1. Chạy `git status` và `Get-ChildItem -Recurse -File src` để biết M5 đã đổi/tách file gì. **M5 có thể đã tách `src/store/playback/*`, thêm `m5-control.css`, `CaseReport`, `ControlRoom`…; phải đọc lại file thật, không đoán theo prompt này.**
2. Kiểm tra M5 đã xong chưa:
   - `docs/06-ROADMAP.md` mục M5 đã tick hết.
   - `docs/PROGRESS.md` có mục M5.
   - `src/store/m5Flows.test.ts` tồn tại và pass.
   - `npm test` pass.
3. Nếu M5 **chưa** xong: **dừng**, báo người dùng “M6 cần M5 xong trước để tránh sửa trùng `playback/store.ts`, `session.ts`, `Hud.tsx`, `ControlRoom.tsx`”. Không tự sửa file M5 đang làm.
4. Ghi lại số test baseline (`npm test` → x/y file, n test). Cuối M6 tổng test phải tăng, không được giảm.
5. Đọc lại các file AI hiện tại trước khi sửa:
   - `src/ai/provider.ts`, `src/ai/mock.ts`, `src/ai/index.ts`, `src/ai/live.ts`, `src/ai/prompts.ts`
   - `src/engine/types.ts` (AIProvider, EngineEvent, SentMessage)
   - `src/engine/handlers/service.ts`, `src/engine/handlers/send.ts`
   - `src/store/playback/session.ts`, `src/store/playback/store.ts`, `src/store/playback/types.ts`, `src/store/useApp.ts`
   - `src/data/scenarios.ts`, `src/data/knowledge-base.ts`, `src/data/letters.ts`
   - `src/ui/desks/AiBriefPanel.tsx`, `src/ui/desks/student/AssistantTab.tsx`
   - `src/ui/shell/Hud.tsx`, `src/ui/desks/control/controlLog.ts`, `src/ui/shell/EventLog.tsx`
   - `src/ui/desks/principal/DecisionDraft.tsx`, `src/ui/desks/student/LetterModal.tsx`
   - `src/ui/kit/Typewriter.tsx`, `src/ui/motion.ts`, `src/main.tsx`, `vite.config.ts`, `tsconfig.json`

> Nếu file nào trong danh sách đã bị M5 đổi tên/tách nhỏ, bám theo cấu trúc mới nhưng giữ nguyên hành vi mô tả ở đây.

---

## 3. Hiện trạng AI (để không phải dò lại)

- `AIProvider` nằm ở `src/engine/types.ts`, gồm 4 method: `analyzeDocuments`, `chat`, `reviewerBrief`, `draftText`. `src/ai/provider.ts` đang **khai báo trùng** interface này → cần bỏ bản trùng, chỉ re-export.
- `MockAIProvider` đã có:
  - AI-1 trả `scenario.aiScript.docScanResult`; nếu không có minh chứng thì luôn trả confidence 0.1 + anomaly “chưa đính kèm”.
  - AI-3 trả `advisorBrief` / `ctsvBrief`; nếu không có script thì trả brief generic.
  - AI-4 trả `returnMessage` / `rejectMessage` / `decisionBasis`; nếu không có script thì trả câu generic.
  - AI-2 gọi `answerStudentQuestion` từ `src/data/knowledge-base.ts` (hiện 6 intent).
- Engine đã emit `ai.requested` / `ai.responded` cho AI-1 (T1), AI-4 (T2, T7, T8). **AI-3 do UI gọi qua `askReviewerBrief` và chưa được ghi vào `currentEventLog`.** AI-2 chat cũng chưa dùng provider chung, đang tự tạo `new MockAIProvider(undefined, 700)` trong `AssistantTab.tsx`.
- `src/ai/live.ts` và `src/ai/prompts.ts` mới là file rỗng TODO.
- HUD đang hiện badge tĩnh `AI: {aiMode.toUpperCase()}`; `AiBriefPanel` và `AssistantTab` hardcode `AI · MOCK`; chưa có công tắc LIVE; chưa có trạng thái “AI đang đọc hồ sơ…”.
- `src/store/useApp.ts` đã có `aiMode: 'mock' | 'live'` nhưng **chưa có** `aiStatus`, `aiBusy`, `aiLiveAvailable`, action đổi mode.
- `docs/05-AI-SPEC.md` là nguồn sự thật cho nội dung AI; `docs/01-PROCESS-SPEC.md` là nguồn sự thật cho quy trình và R1–R4.

---

## 4. Luật cứng của M6

1. **AI gợi ý — Rule quyết — Người ký.** AI không được đổi `validity`, `ruleResult`, `eligible`, không tự ký, không tự gửi message, không quyết định thay `completeUserTask`.
2. Không đổi topology, ID node, lane, thứ tự BPMN, event shape hiện có (chỉ được thêm field optional nếu thật cần).
3. Offline-first: mock phải chạy 100% không mạng. Live chỉ là lớp phủ, lỗi/timeout phải fallback mock, UI không treo, không hiện lỗi đỏ giữa demo.
4. Không thêm dependency. Live dùng `fetch` + `AbortController` có sẵn.
5. TypeScript strict, **cấm `any`**; file ≤ 300 dòng; component nhỏ, một việc một file.
6. UI 100% tiếng Việt có dấu. Không hiển thị `confirm/decline/valid/invalid` thô ra UI; phải map sang tiếng Việt.
7. Mọi animation đọc `speed` từ `useAppStore`; tôn trọng `reducedMotion` (hiện full text ngay, không gõ chữ).
8. Không hardcode màu/thời lượng trong component; dùng token ở `src/styles/tokens.css` và `src/ui/motion.ts`.
9. Không commit `.env.local`, không log API key, không đưa key vào URL/console.
10. Không đụng file ngoài phạm vi M6. Không refactor lan man. Không sửa test cũ để “cho pass” trừ khi hành vi thật đổi có chủ đích (ghi lý do).

---

## 5. Kiến trúc đích

```
src/ai/
  provider.ts        kiểu dữ liệu AI + AIScriptConfig + CaseSummary (bỏ AIProvider trùng)
  mock.ts            MockAIProvider (deterministic, 0–700ms)
  mockTemplates.ts   helper thuần: khớp minh chứng với lý do, brief fallback, draft fallback
  prompts.ts         prompt tiếng Việt + builder payload cho live
  validate.ts        parse/validate JSON live (không dùng any)
  live.ts            LiveAIProvider (Gemini REST, timeout 4s, retry 1)
  service.ts         AIService: chọn mock/live, fallback, phát status + activity
  index.ts           export công khai

src/store/
  useApp.ts          thêm aiStatus, aiBusy, aiLiveAvailable, setAiStatus, setAiBusy, setAiMode
  playback/session.ts    giữ AIService thay vì MockAIProvider
  playback/store.ts      askAssistant, setAiMode, log AI-3, nối status/activity
  playback/types.ts      khai báo action mới

src/ui/
  kit/AiBadge.tsx     badge nguồn AI dùng chung
  kit/AiText.tsx      typewriter dùng chung, tôn trọng speed + reducedMotion
  shell/AiModeSwitch.tsx  công tắc MOCK/LIVE trên HUD
  desks/AiBriefPanel.tsx  dùng badge + AiText + note fallback
  desks/student/AssistantTab.tsx  gọi store, không tự tạo provider
  desks/student/LetterModal.tsx   note “AI soạn” cho MF2/MF3
  desks/principal/DecisionDraft.tsx  nhãn “Căn cứ · AI soạn (AI-4)”
  desks/control/ControlTerminal.tsx  dòng “AI đang xử lý…” theo aiBusy
  shell/EventLog.tsx  map ai.requested/ai.responded rõ hơn
  desks/control/controlLog.ts  phân biệt DocScan / Brief / Draft + dòng ai.requested

src/styles/m6-ai.css
src/data/knowledge-base.ts  mở rộng intent
src/data/scenarios.ts       rà & bổ sung aiScript còn thiếu
```

Luồng chuẩn:

1. **AI-1 (T1):** `T1` → `ai.requested` → `AIService.analyzeDocuments` (activity `AI-1`) → mock/live → `ai.responded` → T1 tự tính `validity` bằng code.
2. **AI-2 (chat):** `AssistantTab` → `usePlaybackStore.askAssistant(history, ctx)` → `AIService.chat` (activity `AI-2`) → trả string. AI-2 **không** ghi vào event log BPMN (đây là trợ lý cổng thông tin, không phải node quy trình).
3. **AI-3 (T4/T5):** người bấm “Hỏi AI” → `askReviewerBrief(role)` → `AIService.reviewerBrief` (activity `AI-3`) → store ghi 1 cặp `ai.requested/ai.responded` với `touchpoint: 'AI-3'`, `source: 'T4' | 'T5'` (dedupe theo role/ca) → panel hiển thị.
4. **AI-4 (T2/T7/T8):** engine gọi `draftText` như hiện tại; thêm `aiGenerated: true` vào message MF2/MF3; MF4 chỉ đánh dấu phần “Căn cứ” do AI soạn.
5. **Badge:** `aiStatus` toàn cục = `mock | live | fallback`; `aiMode` là lựa chọn của người dùng. `AIService.source` phát qua listener → `useAppStore.setAiStatus`.
6. **Activity:** `AIService` phát `AI-1…AI-4` trước khi gọi và `null` sau khi xong → `useAppStore.aiBusy`.

---

## 6. Kế hoạch thi hành theo phase (làm đúng thứ tự, test sau mỗi phase)

### Phase 1 — Nền kiểu dữ liệu & env

**File sửa:**

- `src/vite-env.d.ts`
- `src/ai/provider.ts`
- `src/engine/types.ts` (chỉ thêm field optional)

**Việc làm:**

1. `vite-env.d.ts` khai báo:
   ```ts
   interface ImportMetaEnv {
     readonly VITE_GEMINI_API_KEY?: string;
     readonly VITE_GEMINI_MODEL?: string;
   }
   interface ImportMeta {
     readonly env: ImportMetaEnv;
   }
   ```
2. `src/ai/provider.ts`:
   - Bỏ khai báo `AIProvider` trùng; `export type { AIProvider, DocScanInput, DocScanResult, ReviewerBrief } from '../engine/types';`
   - Giữ `CaseSummary`, `AIScriptConfig`.
   - Thêm `evidence?: EvidenceItem[]` và `aiScan?: DocScanResult` vào `CaseSummary` (optional, không phá chỗ gọi cũ).
   - Thêm `export interface ChatMessage { role: 'user' | 'assistant'; content: string; }`
   - Thêm `export type AIStatus = 'mock' | 'live' | 'fallback';`
3. `src/engine/types.ts`:
   - `SentMessage` thêm `aiGenerated?: boolean`.
   - **Không đổi chữ ký `AIProvider`** (giữ `ctx: unknown`) để không phá M1–M5; mock/live tự narrow bằng helper.
4. Chạy `npx tsc --noEmit`. Sửa hết lỗi do bỏ interface trùng.

**Acceptance:** build type sạch, chưa đổi hành vi runtime.

---

### Phase 2 — Hoàn thiện mock AI-1…AI-4

**File mới:**

- `src/ai/mockTemplates.ts` (helper thuần, ≤ 250 dòng)
- `src/ai/mock.test.ts`

**File sửa:**

- `src/ai/mock.ts`
- `src/data/scenarios.ts`

#### 2.1 `mockTemplates.ts`

Viết các hàm thuần, không React/DOM:

```ts
export function matchEvidenceToReason(
  reason: StudentApplicationForm['reason'],
  evidence: EvidenceItem[]
): { matches: boolean; matchedIds: string[] };

export function buildFallbackDocScan(
  form: StudentApplicationForm,
  evidence: EvidenceItem[]
): DocScanResult;

export function buildFallbackBrief(
  role: 'advisor' | 'ctsv',
  ctx: CaseSummary
): ReviewerBrief;

export function buildFallbackDraft(
  kind: 'return' | 'reject' | 'decisionBasis',
  ctx: CaseSummary
): string;
```

Quy tắc bắt buộc:

- Khớp minh chứng với lý do:
  - `'Ốm đau/tai nạn điều trị dài'` → type `medical_record` hoặc tên/nội dung chứa `viện`, `bệnh án`, `phẫu thuật`, `y tế`.
  - `'Nghĩa vụ quân sự'` → type `military_call` hoặc `quân sự`, `nhập ngũ`, `nghĩa vụ`.
  - `'Hoàn cảnh gia đình'` → type `hardship_proof` hoặc `hoàn cảnh`, `UBND`, `xác nhận`, `gia đình`.
  - `'Lý do cá nhân khác'` → type `personal_reason` hoặc `thực tập`, `giao lưu`, `trao đổi`, `cá nhân`.
  - So khớp không dấu bằng `normalizeText` (import từ `knowledge-base` hoặc copy hàm thuần).
- `buildFallbackDocScan`:
  - Không có minh chứng → `confidence: 0.1`, `typeMatchesReason: false`, anomaly high “chưa đính kèm”.
  - Có minh chứng → `evidenceType` = type tờ đầu; `extracted` lấy từ `evidence.fields` (`field.id → field.value`) + `documentName`; `anomalies` gom `field.anomaly` + `issueNotes`.
  - `confidence` khởi điểm 0.95; trừ 0.2/high, 0.1/medium, 0.05/low; nếu không khớp lý do thì `min(confidence, 0.4)`; kẹp `[0.2, 0.99]`.
- `buildFallbackBrief`:
  - `advisor`: summary nêu tên + số học kỳ + lý do; points tối đa 4 gồm R1–R4 đạt/không đạt, minh chứng khớp/không, ngày chờ; `suggestedDecision = 'confirm'` chỉ khi `validity.complete && validity.evidenceOk && ruleResult.pass`, ngược lại `'decline'`.
  - `ctsv`: gom anomaly từ `ctx.aiScan?.anomalies` + `collectAnomalies(ctx.evidence ?? [])` (import `../../data/inspection`), dedupe theo `issue`; summary “Phát hiện n bất thường…” hoặc “Không phát hiện bất thường”; points tối đa 4; `suggestedDecision = anomalies.length > 0 ? 'invalid' : 'valid'`.
  - Rationale luôn kết thúc bằng ý “Đây chỉ là đề xuất, người duyệt quyết định”.
- `buildFallbackDraft`:
  - `return`: liệt kê `ctx.validity.missing`; nếu `evidenceOk === false` thêm “minh chứng chưa khớp lý do”; câu ngắn ≤ 120 từ.
  - `reject`: liệt kê `ctx.ruleResult.violations`; nếu không có thì nêu trạng thái advisor/ctsv; thêm hướng xử lý “liên hệ Phòng Công tác sinh viên”.
  - `decisionBasis`: dùng đúng `form.fullName`, `form.mssv`, `form.semesterCount`, `form.startSemester`; không bịa số quyết định.
  - Không thêm quy chế ngoài `01-PROCESS-SPEC.md`.

#### 2.2 `mock.ts` (rewrite có kiểm soát)

- Giữ `class MockAIProvider implements AIProvider`, `mode = 'mock'`, constructor `(script?, latencyMs = 0)`, `setScript`.
- `analyzeDocuments`:
  1. Nếu `evidence.length === 0` → luôn trả kết quả no-evidence deterministic (kể cả có script). Đây là rule của mock, không phải AI quyết định.
  2. Nếu có `script.docScanResult` → trả script.
  3. Ngược lại → `buildFallbackDocScan`.
- `reviewerBrief(role, ctx)`:
  1. narrow `ctx` bằng helper `asCaseSummary(ctx)`.
  2. Nếu có script tương ứng → trả script.
  3. Ngược lại → `buildFallbackBrief`.
- `draftText(kind, ctx)`:
  1. Nếu có script tương ứng → trả script.
  2. Ngược lại → `buildFallbackDraft`.
- `chat(history, ctx)`:
  1. Lấy câu hỏi user cuối cùng.
  2. Gọi `answerStudentQuestion(text, asChatContext(ctx))`.
  3. Không random, không gọi mạng.
- Giữ `defaultMockAI = new MockAIProvider(undefined, 0)`.

#### 2.3 Rà `scenarios.ts`

- Giữ nguyên `aiScript` hiện có; bổ sung cho đúng dữ kiện:
  - S1: thêm `admissionDate`, `dischargeDate` vào `docScanResult.extracted` nếu muốn khớp fields.
  - S3: thêm `issuedDate`, `issuerStamp` vào extracted.
  - S4: thêm `duration`, `issuer` vào extracted.
  - S5: `docScanResult.anomalies` phải đủ **3** điểm khớp brief: `name_mismatch`, `date_order`, `missing_stamp`; confidence giữ `0.65` để T1 vẫn qua cho CTSV thẩm định.
  - S2: `returnMessage` có sẵn; không cần advisor/ctsv vì không tới T4/T5.
  - S6/Custom: **không thêm `aiScript` cố định**; để heuristic xử lý mọi MSSV người dùng nhập.
- Không đổi `directorPlan`, form, evidence, expectedOutcome.

#### 2.4 Test `src/ai/mock.test.ts`

Bắt buộc có các case:

1. S1: `analyzeDocuments` deep-equal `s1.aiScript.docScanResult`; confidence ≥ 0.6.
2. S2: không có minh chứng → confidence 0.1, anomaly high, bất kể script.
3. S6/custom: form + evidence hợp lệ → `typeMatchesReason === true`, extracted có `patientName`/`hospital`, confidence > 0.6.
4. Custom sai loại: lý do nghĩa vụ quân sự + giấy y tế → `typeMatchesReason === false`, confidence ≤ 0.4.
5. S5: brief CTSV có `suggestedDecision === 'invalid'` và đủ 3 point.
6. Fallback CTSV: evidence có anomaly (dùng evidence S5 nhưng không script) → invalid; evidence sạch → valid.
7. Fallback return: chứa các `missing` đã truyền.
8. Fallback reject: chứa violation “Công nợ học phí”/số nợ.
9. Fallback decisionBasis: chứa họ tên, MSSV, số học kỳ, học kỳ bắt đầu.
10. Deterministic: gọi 2 lần cùng input → cùng output.
11. Chat: câu “Tiến độ hồ sơ của tôi?” với ctx chờ T4 → trả câu có “Cố vấn”.

Chạy `npx vitest run src/ai/mock.test.ts`.

---

### Phase 3 — Chatbot AI-2: 11 intent + context

**File sửa:** `src/data/knowledge-base.ts`
**File mới:** `src/data/knowledge-base.test.ts`

Mở rộng `KnowledgeEntry['id']` thành:

```ts
'greeting' | 'submit' | 'documents' | 'evidenceByReason' | 'duration'
| 'progress' | 'rejection' | 'fees' | 'eligibility' | 'contact' | 'thanks'
```

Nội dung (bám đúng spec, không bịa):

- `evidenceByReason` — “Tùy lý do: ốm đau/tai nạn → giấy ra viện/bệnh án; nghĩa vụ quân sự → giấy gọi nhập ngũ; hoàn cảnh gia đình → xác nhận của UBND/địa phương; lý do cá nhân khác → giấy tờ chứng minh phù hợp. Giấy phải khớp lý do đã khai.”
- `fees` — “Điều kiện R3: công nợ học phí phải bằng 0. Nếu còn nợ, hồ sơ chưa đủ điều kiện bảo lưu; bạn thanh toán rồi nộp lại.”
- `eligibility` — Liệt kê R1–R4 đúng `01-PROCESS-SPEC.md` mục 6 + cần Cố vấn xác nhận & CTSV thẩm định minh chứng.
- `contact` — “Phòng Công tác sinh viên — Trường ĐH Kinh tế, ĐH Đà Nẵng.”
- `thanks` — Câu cảm ơn ngắn, lịch sự.
- Giữ/ tinh chỉnh `greeting`, `submit`, `documents`, `duration`, `progress`, `rejection`.

Quy tắc:

- `normalizeText` giữ nguyên (bỏ dấu, `đ → d`).
- `matchIntent` thứ tự ưu tiên: `rejection` → `progress` → `evidenceByReason` → `documents` → `duration` → `fees` → `eligibility` → `contact` → `submit` → `thanks` → `greeting`.
- `answerProgress(ctx)` giữ các trạng thái hiện có; thêm trường hợp chưa nộp / đã có MF4 / MF2 / MF3 / T4 / T5 / T9.
- `answerRejection(ctx)` giữ; nếu `missing`/`violations` rỗng thì câu chung.
- Thêm `answerFees(ctx)`: nếu `ctx.violations` có “học phí” thì trích đúng violation; ngược lại câu chung R3.
- `QUICK_QUESTIONS` nâng lên **6** câu: Cách nộp đơn / Cần giấy tờ gì / Mất bao lâu / Tiến độ hồ sơ / Điều kiện bảo lưu / Liên hệ ai.
- Không bịa quy chế; không hứa kết quả; fallback vẫn là `KB_FALLBACK`.

Test `knowledge-base.test.ts`:

- Mỗi intent có ít nhất 1 câu mẫu match đúng (bảng 11 dòng).
- Câu không dấu `tien do ho so` → `progress`; `hoc phi` → `fees`.
- Câu vô nghĩa → `KB_FALLBACK`.
- `answerStudentQuestion` với `submitted: false` → nhắc nộp đơn.
- Với `waitingTask: 'T4'` → có “Cố vấn” + “SLA”.
- Với `lastMessageFlow: 'MF2'` + `missing` → liệt kê missing.
- Với `lastMessageFlow: 'MF3'` + `violations` → liệt kê violation.
- Với violation học phí → câu trả lời `fees` có số tiền/nội dung.
- `QUICK_QUESTIONS` có 6 phần tử và id nào cũng tồn tại trong `KNOWLEDGE_ENTRIES`.

Chạy `npx vitest run src/data/knowledge-base.test.ts`.

---

### Phase 4 — `AIService` + nối store (mock/live, status, activity, AI-3 log)

**File mới:**

- `src/ai/service.ts`
- `src/ai/service.test.ts`
- `src/store/m6Flows.test.ts`

**File sửa:**

- `src/store/useApp.ts`
- `src/store/playback/session.ts`
- `src/store/playback/types.ts`
- `src/store/playback/store.ts`

#### 4.1 `AIService`

```ts
export type AISource = 'mock' | 'live' | 'fallback';

export class AIService implements AIProvider {
  public mode: 'mock' | 'live';
  public source: AISource;
  constructor(
    private mock: MockAIProvider,
    private live: AIProvider | null,
    initialMode: 'mock' | 'live' = 'mock'
  );
  setMode(mode: 'mock' | 'live'): boolean; // false nếu live null
  onSourceChange(fn: (source: AISource) => void): () => void;
  onActivity(fn: (touchpoint: string | null) => void): () => void;
  dispose(): void;
  // 4 method AIProvider
}
```

Hành vi:

- `mode` = lựa chọn; `source` = nguồn thực tế.
- `setMode('live')` khi `live === null` → trả `false`, không đổi gì.
- `setMode('mock')` → `source = 'mock'`, phát listener.
- `setMode('live')` → `source = 'live'`, phát listener (kể cả đang fallback, để thử lại).
- Mỗi lần gọi:
  1. phát activity touchpoint (`AI-1`…`AI-4`).
  2. nếu `mode === 'live' && live && source !== 'fallback'`: thử live.
  3. live lỗi → `source = 'fallback'`, phát listener, gọi mock.
  4. nếu `source === 'fallback'` → gọi mock trực tiếp (không thử live lại trong ca).
  5. `finally` phát activity `null`.
- Không nuốt lỗi của mock (mock phải deterministic, không throw).
- Mapping method → touchpoint: `analyzeDocuments: AI-1`, `chat: AI-2`, `reviewerBrief: AI-3`, `draftText: AI-4`.

Test `service.test.ts`:

- mock mode → gọi mock, source mock.
- live mode + fake live success → kết quả live, source live.
- live mode + fake live throw → kết quả mock, source fallback, listener nhận `fallback`; gọi lần 2 không gọi live nữa.
- `setMode('live')` khi live null → false, mode vẫn mock.
- `onActivity` nhận đúng touchpoint rồi `null`.
- `dispose` gỡ listener.

#### 4.2 `useApp.ts`

Thêm:

```ts
aiStatus: 'mock' | 'live' | 'fallback';
aiBusy: string | null;
aiLiveAvailable: boolean;
setAiStatus: (status: 'mock' | 'live' | 'fallback') => void;
setAiBusy: (touchpoint: string | null) => void;
setAiMode: (mode: 'mock' | 'live') => void;
```

- `aiLiveAvailable: isLiveAvailable()` (import từ `../ai/live`; phase 5 mới có file — nếu làm phase 4 trước, tạm export `isLiveAvailable` từ `ai/live.ts` trả `false` rồi hoàn thiện ở phase 5).
- `aiMode` mặc định `'mock'`, `aiStatus` mặc định `'mock'`, `aiBusy: null`.
- `resetCase` set `aiBusy: null`; không đổi `aiMode` (người dùng đã chọn live thì giữ khi chọn ca mới).
- Không persist localStorage.

#### 4.3 `session.ts`

- `PlaybackSession.ai: AIService`.
- `beginSession(scenario, initialMode: 'mock' | 'live' = 'mock')`:
  ```ts
  const mock = new MockAIProvider(scenario.aiScript, aiDelayMs());
  const live = createLiveAIFromEnv(); // phase 5; phase 4 có thể null
  const ai = new AIService(mock, live, initialMode);
  ```
- Trước khi tạo session mới: `activeAI?.dispose()`.
- `getActiveAI(): AIService | null`.

#### 4.4 `playback/types.ts`

Thêm:

```ts
askAssistant: (history: ChatMessage[], ctx: StudentChatContext) => Promise<string>;
setAiMode: (mode: 'mock' | 'live') => boolean;
```

Import `ChatMessage` từ `../../ai/provider`, `StudentChatContext` từ `../../data/knowledge-base`.

#### 4.5 `playback/store.ts`

- `initScenario`:
  ```ts
  const session = beginSession(scenario, useAppStore.getState().aiMode);
  session.ai.onSourceChange((source) => useAppStore.getState().setAiStatus(source));
  session.ai.onActivity((tp) => useAppStore.getState().setAiBusy(tp));
  useAppStore.getState().setAiStatus(session.ai.source);
  useAppStore.getState().setAiBusy(null);
  ```
- `setAiMode(mode)`:
  ```ts
  const ai = getActiveAI();
  if (!ai) return false;
  const ok = ai.setMode(mode);
  if (ok) useAppStore.getState().setAiMode(mode);
  return ok;
  ```
- `askAssistant(history, ctx)`:
  ```ts
  const ai = getActiveAI();
  if (!ai) return 'Trợ lý chưa sẵn sàng. Bạn thử lại sau nhé.';
  return ai.chat(history, ctx);
  ```
  Không ghi event log.
- `askReviewerBrief(role)`:
  - Lấy `ctx` như hiện tại + `evidence: engine.state.evidence`.
  - Tìm `aiScan` từ event log: `ai.responded` gần nhất có `touchpoint === 'AI-1'`, cast `DocScanResult`.
  - Gọi `ai.reviewerBrief(role, ctx)` trong `try/catch`; lỗi → trả `null` (không treo UI).
  - Nếu thành công và **chưa từng** có `ai.requested` với `touchpoint === 'AI-3'` + `source` tương ứng trong `currentEventLog`:
    ```ts
    set((s) => ({
      currentEventLog: [
        ...s.currentEventLog,
        { type: 'ai.requested', touchpoint: 'AI-3', source },
        { type: 'ai.responded', touchpoint: 'AI-3', source, result },
      ],
      eventDays: [...s.eventDays, day, day],
    }));
    ```
  - `source = role === 'advisor' ? 'T4' : 'T5'`.
  - Dedupe để không làm phồng `aiTouches` khi người dùng bấm “Hỏi AI” nhiều lần.
- `reset` / `initScenario`: `setAiBusy(null)`.

Test `m6Flows.test.ts` (headless, không mạng):

1. `initScenario('s1')`; `setAiMode('live')` → `false` (không có env); `useAppStore.getState().aiMode === 'mock'`.
2. `askReviewerBrief('advisor')` → không null; log có đúng 1 cặp `ai.requested/ai.responded` `AI-3` `T4`; gọi lại lần 2 → vẫn chỉ 1 cặp.
3. `askAssistant([{role:'user',content:'Tiến độ hồ sơ của tôi?'}], { submitted:false })` → chuỗi khác rỗng, có “nộp”.
4. `initScenario('s5')`; `askReviewerBrief('ctsv')` → `suggestedDecision === 'invalid'`.
5. `reset()` → `aiBusy === null`.

Chạy `npx vitest run src/ai/service.test.ts src/store/m6Flows.test.ts`.

---

### Phase 5 — Live Gemini (tùy chọn nhưng phải làm nếu còn thời gian)

**File mới:**

- `src/ai/prompts.ts`
- `src/ai/validate.ts`
- `src/ai/live.ts`
- `src/ai/live.test.ts`

**File sửa:**

- `src/ai/index.ts`
- `.env.example` (chỉ comment hướng dẫn, không điền key)

#### 5.1 `prompts.ts`

- System prompt **đúng nguyên văn** `docs/05-AI-SPEC.md` mục 5 cho AI-1, AI-2, AI-3, AI-4. Viết tiếng Việt có dấu.
- `PromptBundle = { system: string; user: string; json: boolean }`.
- `buildDocScanPayload(input: DocScanInput): PromptBundle` — gửi form + evidence (type, name, content, fields), kèm schema JSON:
  ```json
  {"evidenceType":"string","typeMatchesReason":true,"extracted":{"key":"value"},"anomalies":[{"field":"string","issue":"string","severity":"low|medium|high"}],"confidence":0.0}
  ```
- `buildChatPayload(history: ChatMessage[], ctx: unknown): PromptBundle` — chỉ lấy 6 message gần nhất; chèn toàn bộ `KNOWLEDGE_ENTRIES` (id/label/answer) + JSON tình trạng ca; yêu cầu trả lời ngắn, không bịa.
- `buildReviewerPayload(role, ctx: CaseSummary): PromptBundle` — role, tóm tắt ca, schema brief:
  ```json
  {"summary":"string","points":["string"],"suggestedDecision":"confirm|decline|valid|invalid","rationale":"string"}
  ```
- `buildDraftPayload(kind, ctx: CaseSummary): PromptBundle` — kind + dữ kiện; yêu cầu ≤ 120 từ, không thêm dữ kiện mới.

`json: true` cho AI-1/AI-3/AI-4; `json: false` cho AI-2.

#### 5.2 `validate.ts`

- `parseJsonObject(text: string): Record<string, unknown> | null` — bỏ fence ```json, cắt từ `{` đầu đến `}` cuối, `JSON.parse` trong try/catch.
- `validateDocScan(raw): DocScanResult | null` — kiểm tra đủ trường, `confidence` là number 0..1, anomalies chỉ nhận severity hợp lệ; thiếu → null.
- `validateBrief(raw, role): ReviewerBrief | null` — `suggestedDecision` phải đúng bộ cho role (`advisor`: confirm/decline; `ctsv`: valid/invalid); points tối đa 4; thiếu → null.
- `validateDraft(raw): string | null` — string không rỗng, trim, tối đa 800 ký tự.
- Không dùng `any`; dùng `unknown` + type guard.

#### 5.3 `live.ts`

```ts
export function isLiveAvailable(): boolean;
export function createLiveAIFromEnv(): LiveAIProvider | null;

export class LiveAIProvider implements AIProvider {
  public mode: 'live' = 'live';
  constructor(apiKey: string, model: string, timeoutMs = 4000);
  // 4 method
}
```

- `isLiveAvailable()`:
  - `typeof window === 'undefined'` → false.
  - Host phải là `localhost`, `127.0.0.1`, `::1` hoặc rỗng (chỉ demo localhost).
  - Có cả `import.meta.env.VITE_GEMINI_API_KEY` và `VITE_GEMINI_MODEL` (trim khác rỗng).
- `createLiveAIFromEnv()` → `LiveAIProvider` hoặc `null`; không hardcode model.
- Gọi REST:
  ```
  POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
  headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }
  body: {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 800,
      responseMimeType: bundle.json ? 'application/json' : 'text/plain'
    }
  }
  ```
  - `model` bỏ tiền tố `models/` nếu có; `encodeURIComponent`.
  - **Không đưa key vào URL**, không log key.
- Timeout 4s bằng `AbortController`; retry tối đa 1 lần cho lỗi mạng/5xx/timeout; 4xx fallback ngay. Tổng tối đa 2 lần gọi.
- Parse `candidates[0].content.parts[0].text`; rỗng → lỗi.
- AI-1/AI-3/AI-4: parse JSON + validate; invalid → throw `LiveAIError` để `AIService` fallback mock. AI-2: trả text trim; rỗng → throw.
- Không set state, không import React/store.

#### 5.4 `index.ts`

```ts
export * from './provider';
export * from './mock';
export * from './live';
export * from './service';
export * from './prompts';
```

#### 5.5 Test `live.test.ts`

- Giả lập `fetch` bằng `vi.stubGlobal('fetch', vi.fn())`; **không gọi mạng thật**.
- Success AI-1: trả JSON đúng → `DocScanResult` đúng.
- Success AI-2: trả text → string.
- JSON hỏng → throw (hoặc method trả lỗi để service fallback; theo thiết kế: throw).
- `suggestedDecision` sai role → throw.
- Response thiếu `candidates` → throw.
- `isLiveAvailable()` trong node → `false`.
- Khôi phục `vi.unstubAllGlobals()` sau mỗi test.

Thử tay (nếu có key): tạo `.env.local` (không commit):
```
VITE_GEMINI_API_KEY=...
VITE_GEMINI_MODEL=...
```
`npm run dev` → HUD bấm badge → LIVE → chạy S1; ngắt mạng giữa ca → lần gọi sau badge chuyển `MOCK (fallback)`, ca vẫn chạy.

---

### Phase 6 — UI hiển thị chuẩn + log

**File mới:**

- `src/ui/kit/AiBadge.tsx`
- `src/ui/kit/AiText.tsx`
- `src/ui/shell/AiModeSwitch.tsx`
- `src/styles/m6-ai.css`

**File sửa:**

- `src/main.tsx` (import css cuối)
- `src/ui/shell/Hud.tsx`
- `src/ui/desks/AiBriefPanel.tsx`
- `src/ui/desks/student/AssistantTab.tsx`
- `src/ui/desks/StudentDesk.tsx`
- `src/ui/desks/control/ControlTerminal.tsx`
- `src/ui/desks/control/controlLog.ts`
- `src/ui/shell/EventLog.tsx`
- `src/engine/handlers/send.ts`
- `src/data/letters.ts`
- `src/ui/desks/student/LetterModal.tsx`
- `src/ui/desks/principal/DecisionDraft.tsx`

#### 6.1 `AiBadge.tsx`

- Props: `{ compact?: boolean; className?: string }`.
- Đọc `useAppStore(s => s.aiStatus)`.
- Text:
  - `mock` → `AI · MOCK`
  - `live` → `AI · LIVE`
  - `fallback` → `AI · MOCK (fallback)`
- `compact` trên HUD: `AI: MOCK` / `AI: LIVE` / `AI: MOCK (FB)`.
- Luôn có chấm xanh dương `--stamp-blue`; fallback dùng `--amber`; class `ai-source-badge`.
- Không hardcode màu inline; CSS.

#### 6.2 `AiText.tsx`

- Props `{ text: string; speedMs?: number; className?: string; style?: CSSProperties; }`.
- Đọc `speed`, `reducedMotion`.
- `reducedMotion` → render text ngay.
- Ngược lại → `<Typewriter text={text} speedMs={(speedMs ?? MOTION.aiTypewriterCharMs) / speed} />`.

#### 6.3 `AiModeSwitch.tsx`

- Đọc `aiMode`, `aiLiveAvailable`; gọi `usePlaybackStore(s => s.setAiMode)`.
- Render `<button className="ai-mode-switch" title="...">` chứa `<AiBadge compact />`.
- `aiLiveAvailable === false`: `aria-disabled`, title “Chưa cấu hình VITE_GEMINI_API_KEY trong .env.local — đang chạy MOCK”; bấm không đổi mode.
- Có live: bấm đổi mock ↔ live. Nếu `setAiMode` trả false, giữ nguyên.
- Thay cụm badge tĩnh trong `Hud.tsx` bằng component này.

#### 6.4 `AiBriefPanel.tsx`

- Dùng `<AiBadge />` thay text hardcode.
- Header label giữ prop.
- Summary/rationale dùng `<AiText>`.
- Points hiển thị ngay (không cần gõ từng dòng).
- Map `suggestedDecision` sang tiếng Việt:
  - `confirm` → `XÁC NHẬN`
  - `decline` → `KHÔNG XÁC NHẬN`
  - `valid` → `HỢP LỆ`
  - `invalid` → `KHÔNG HỢP LỆ`
- Thêm note khi `aiStatus === 'fallback'`: “AI LIVE không phản hồi — đã chuyển sang MOCK (fallback).”
- Giữ footnote “Quyết định cuối cùng thuộc về người bấm dấu.”
- Loading text đổi thành “AI đang đọc hồ sơ…”.

#### 6.5 `AssistantTab.tsx`

- Bỏ `new MockAIProvider`; dùng `usePlaybackStore(s => s.askAssistant)`.
- Badge `<AiBadge />`.
- `thinking` giữ; khi `aiStatus === 'fallback'` hiện note như trên.
- Tin nhắn assistant dùng `<AiText>` (tôn trọng reducedMotion).
- `QUICK_QUESTIONS` render 6 nút; bọc flex-wrap.
- Giữ `context` prop từ `StudentDesk`.

#### 6.6 `StudentDesk.tsx`

- Đọc `aiBusy` từ `useAppStore`.
- Trong dải “Đã nộp”:
  - Nếu `aiBusy === 'AI-1'` → hiện “🤖 AI đang đọc hồ sơ…” (màu `--stamp-blue`).
  - Ngược lại giữ “✔ Đã nộp… · Xem tiến độ”.
- Không đổi logic nộp/animation.

#### 6.7 `ControlTerminal.tsx`

- Đọc `aiBusy` từ `useAppStore`.
- Nếu `aiBusy` là `AI-1`, `AI-3` hoặc `AI-4`, render thêm một dòng cuối (không đưa vào `lines`):
  ```tsx
  <div className="crt-line" data-tone="info">
    <span className="crt-tag">[{aiBusy}]</span>
    <span className="crt-line-text">AI      {AI_ACTIVITY_TEXT[aiBusy]}</span>
  </div>
  ```
  Text: AI-1 “đang đọc hồ sơ và minh chứng…”, AI-3 “đang tóm tắt hồ sơ cho người duyệt…”, AI-4 “đang soạn văn bản…”. Bỏ qua AI-2 (chat không thuộc Lane L1).
- Giữ auto-scroll; không phá hiệu ứng gõ chữ hiện có.

#### 6.8 `controlLog.ts`

- `fromAi`:
  - Nếu result là `DocScanResult` (có `confidence`) → giữ dòng DocScan.
  - Nếu result có `suggestedDecision` + `summary` → dòng `Brief  ${summary ngắn} → ${suggestedDecision}`.
  - Nếu string → `Draft  ${text ngắn}…`.
- Thêm `case 'ai.requested'`: dòng `yêu cầu ${touchpoint} từ ${source}…` (tone `info`). Không phá test cũ (test dùng `find`/`hasLine`).
- Không đổi các mapping khác.

#### 6.9 `EventLog.tsx`

- Thêm `case 'ai.requested'` → `{ title: 'AI được gọi', detail: `${touchpoint} · từ ${source}` }`.
- `case 'ai.responded'` đổi detail thành `touchpoint · nguồn ${source}` (giữ).
- Không cần log AI-2.

#### 6.10 `send.ts` + `letters.ts` + `LetterModal.tsx`

- `SentMessage` đã có `aiGenerated?: boolean`.
- T2 và T7: thêm `aiGenerated: true` vào `sentMsg`.
- T11: không set (nội dung template).
- `letters.ts`: `PayloadShape.aiGenerated?: boolean`; `LetterDoc.aiGenerated: boolean`; base `aiGenerated: data.aiGenerated === true`.
- `LetterModal`: nếu `letter.aiGenerated` hiện note nhỏ dưới intro:
  “Nội dung do AI soạn (AI-4) · Hệ thống gửi tự động theo quy trình.”
  Dùng `<AiBadge compact />`.
- MF4: đổi heading `Căn cứ` → `Căn cứ (AI soạn)` (basisText do AI-4).
- Không đổi nội dung thư, không đổi dữ kiện.

#### 6.11 `DecisionDraft.tsx`

- Label “Căn cứ” thêm `· AI soạn (AI-4)` và `<AiBadge compact />`.
- Giữ “Tự động điền bởi T8” cho các trường.
- Không đổi chữ ký/dấu.

#### 6.12 `m6-ai.css`

Thêm class (dùng token, không hardcode màu):

- `.ai-source-badge`, `.ai-source-badge[data-status="live"]`, `[data-status="fallback"]`
- `.ai-pulse` (animation 1s; `@media (prefers-reduced-motion: reduce)` tắt)
- `.ai-mode-switch`
- `.ai-fallback-note`
- `.ai-activity`
- `.letter-ai-note`
- `.decision-ai-label`

Import `./styles/m6-ai.css` cuối danh sách import trong `src/main.tsx`.

**Manual UI check sau phase 6:**

- HUD: badge `AI: MOCK`; bấm khi không có key → không đổi, tooltip đúng.
- S1: nộp → thấy “AI đang đọc hồ sơ…” ở dải đã nộp và terminal; sau đó log `[AI-1] DocScan … confidence 0.98`.
- Cố vấn/CTSV: bấm Hỏi AI → badge + gõ chữ + đề xuất tiếng Việt; log/terminal có `AI-3`.
- S2: thư MF2 có note AI soạn; S3: thư MF3 có note AI soạn.
- BGH: dự thảo có nhãn “Căn cứ · AI soạn (AI-4)”.
- Chat: 6 nút nhanh; trả lời đúng context; fallback cho câu lạ.
- `reducedMotion`: không gõ chữ, hiện full text ngay.
- 1366×768: badge HUD không làm vỡ layout.

---

### Phase 7 — Kiểm thử tổng + tài liệu

1. Chạy lần lượt (PowerShell, không nối `&&`):
   - `npx tsc --noEmit`
   - `npx vitest run src/ai src/data/knowledge-base.test.ts src/store/m6Flows.test.ts`
   - `npm test`
   - `npm run build`
2. Chạy tay 6 kịch bản (S1–S5 + Custom) trên `npm run dev`:
   - Đủ AI-1, AI-2, AI-3, AI-4 ở các điểm chạm.
   - Không lỗi console.
   - S2/S3/S5 ra đúng kết cục; S1 ra `E_END_OK`; S4 timer + `E_END_OK`.
3. Tắt mạng (DevTools → Offline) sau khi load trang → chơi lại S1 + hỏi chat: mock vẫn chạy, badge vẫn `MOCK`.
4. Nếu có `.env.local`: bật LIVE, chạy 1 ca, ngắt mạng → fallback badge; không treo quá ~5s/lần gọi.
5. Kiểm tra 1920×1080 và 1366×768; chữ tiếng Việt đủ dấu ở badge, panel, thư, terminal.
6. Cập nhật `docs/06-ROADMAP.md`: tick 3 checkbox M6; thêm `✅` vào dòng DoD nếu muốn.
7. Thêm mục `docs/PROGRESS.md` theo mẫu, ghi rõ:
   - Ngày, Milestone M6.
   - Đã làm (mock AI-1…AI-4, chatbot intent, badge/activity, log AI-3, live/fallback).
   - File chính đã đụng.
   - ASSUMPTION:
     - AI-3 do UI gọi nên store ghi log, dedupe 1 lần/role/ca.
     - Chat AI-2 không ghi vào event log BPMN.
     - Fallback sticky trong ca cho tới khi đổi mode/reset.
     - Custom dùng heuristic, không có `aiScript` cố định.
     - Mock latency 700ms trên browser, 0ms trong test.
     - Live chỉ chạy localhost + có đủ 2 biến env; model không hardcode.
   - Nợ kỹ thuật (nếu có): live chưa test với API thật trong CI; chưa có UI automation; badge fallback là trạng thái toàn cục.
   - Đã chạy: `npx tsc --noEmit`, `npm test`, `npm run build` → kết quả cụ thể; số test trước/sau.

---

## 7. Ma trận test tối thiểu

| File | Nội dung | Bắt buộc |
|---|---|---|
| `src/ai/mock.test.ts` | AI-1…AI-4 deterministic, script, fallback, custom, no evidence | Có |
| `src/data/knowledge-base.test.ts` | 11 intent, không dấu, fallback, context progress/rejection/fees, 6 quick questions | Có |
| `src/ai/service.test.ts` | chọn mock/live, fallback, status, activity, setMode | Có |
| `src/ai/live.test.ts` | fetch giả, parse/validate, lỗi JSON, role sai, không mạng | Có nếu làm live |
| `src/store/m6Flows.test.ts` | AI-3 log/dedupe, askAssistant, setAiMode khi không có live, reset aiBusy | Có |
| `src/engine/*.test.ts`, `src/store/m4Flows.test.ts`, `m5Flows.test.ts`, `caseReport.test.ts` | Không được giảm/hỏng | Chạy lại toàn bộ |

Lưu ý test cũ:

- `caseReport.test.ts` đang kỳ vọng `aiTouches` S1 = 2 (AI-1 + AI-4). Vì AI-3 chỉ log từ store, test engine trực tiếp không đổi. **Không sửa kỳ vọng này** trừ khi có lý do rõ ràng.
- `m4Flows`/`m5Flows` dùng store; nếu test nào bấm “Hỏi AI” thì mới tăng `aiTouches`. Hiện chưa có; giữ nguyên.
- `controlLog.test.ts` dùng `find`/`hasLine`, thêm dòng `ai.requested` không phá; nhưng phải đảm bảo dòng DocScan đầu tiên vẫn chứa `confidence 0.98`.

---

## 8. Checklist Definition of Done

- [ ] AI-1: mọi kịch bản có minh chứng trả đúng script; không minh chứng luôn fail evidence; custom dùng heuristic; anomaly S5 đủ 3 điểm.
- [ ] AI-2: 11 intent, 6 câu hỏi nhanh, trả lời context-aware (tiến độ/từ chối/học phí), fallback đúng câu quy định, không bịa quy chế.
- [ ] AI-3: panel ở Cố vấn + CTSV, badge đúng, gõ chữ, đề xuất tiếng Việt, không tự quyết định; log `AI-3` một lần/role/ca.
- [ ] AI-4: T2/T7/T8 soạn văn bản đúng dữ kiện; thư MF2/MF3 có nhãn AI; dự thảo có nhãn “Căn cứ · AI soạn”.
- [ ] Badge nguồn `AI · MOCK` / `AI · LIVE` / `AI · MOCK (fallback)` ở HUD + panel + chat; đổi đúng khi live/fallback.
- [ ] Trạng thái “AI đang đọc hồ sơ…” hiện khi T1 chạy (dải đã nộp + terminal).
- [ ] `ai.requested/ai.responded` có trong log; `ControlTerminal` phân biệt DocScan/Brief/Draft; `EventLog` map được.
- [ ] Live (nếu làm): env-gated, localhost-only, timeout 4s, retry 1, validate JSON, fallback mock, không lộ key, không hardcode model.
- [ ] Offline: mock chạy 100%; không lỗi console; không treo UI.
- [ ] `npx tsc --noEmit` sạch; `npm test` pass toàn bộ; `npm run build` pass.
- [ ] Không thêm dependency; không đổi topology/ID BPMN; file ≤ 300 dòng; UI 100% tiếng Việt có dấu.
- [ ] `docs/06-ROADMAP.md` tick M6; `docs/PROGRESS.md` có mục M6 đầy đủ.

---

## 9. Những việc KHÔNG làm trong M6

- Không làm Director mode, phím tắt trợ giúp `?`, As-Is, SFX (M7/M8).
- Không sửa `docs/01-PROCESS-SPEC.md`, `docs/05-AI-SPEC.md` (spec là nguồn sự thật).
- Không đổi rule R1–R4, không đổi `eligible`, không đổi điều kiện G1/G4.
- Không thêm backend/proxy/server; live gọi trực tiếp từ browser như spec.
- Không lưu API key vào localStorage/URL/log/console.
- Không thêm `axios`, `openai`, SDK Gemini hay dependency mới.
- Không “dọn dẹp” M5, không đổi `CaseReport`, `ControlRoom` layout ngoài dòng AI activity.
- Không commit `.env.local`; không commit gì nếu người dùng chưa yêu cầu.

---

## 10. Khi bị kẹt

- Nếu M5 chưa xong → dừng, báo, không sửa trùng.
- Nếu Gemini CORS/key lỗi → giữ mock, badge fallback, ghi nợ “live chưa xác thực” vào PROGRESS; không chặn DoD.
- Nếu test cũ đỏ do thay đổi có chủ đích → ghi rõ lý do trong PROGRESS; không xóa test.
- Nếu spec mơ hồ → chọn phương án đơn giản nhất, ghi `ASSUMPTION:`; không hỏi vòng vo.

---

## 11. Lệnh kiểm tra cuối (chạy riêng từng lệnh trên PowerShell)

```powershell
npx tsc --noEmit
npx vitest run src/ai src/data/knowledge-base.test.ts src/store/m6Flows.test.ts
npm test
npm run build
```

Kỳ vọng: tất cả pass; số test cuối > baseline; build không warning TypeScript; không lỗi console khi chạy tay.
