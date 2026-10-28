# 04 · ARCHITECTURE — Stack, cấu trúc, engine

## 1. Stack (chốt, KHÔNG thêm thứ khác nếu chưa ghi lý do)
- **Vite + React 18 + TypeScript (strict)** — agent nào cũng quen, build nhanh.
- **Zustand** — store gọn cho UI/engine snapshot.
- **Framer Motion** — animation giấy, con dấu, chuyển cảnh. Token trên bản đồ có thể dùng SVG + `requestAnimationFrame`/`offset-path`.
- **Vitest** — test engine headless.
- **@fontsource/** (courier-prime, ibm-plex-mono, vt323, be-vietnam-pro) — font offline.
- Không dùng: Tailwind, UI kit, router, bpmn-js, backend, database. CSS thuần + CSS variables (`tokens.css`, `base.css`, CSS Modules tùy chọn).
- Lý do chọn đơn giản: demo chạy localhost, phải ổn định; agent nhẹ (Flash) làm tốt hơn khi stack phổ biến, ít bước.

## 2. Lệnh
- `npm run dev` — phát triển.
- `npm test` — Vitest (engine headless).
- `npm run build` rồi `npm run preview` — **chạy bản này khi thuyết trình** (ổn định hơn dev server).

## 3. Cấu trúc thư mục
```
bao-luu-please/
  AGENTS.md  .env.example  index.html  package.json  vite.config.ts  tsconfig.json
  docs/                       (các file .md này + PROGRESS.md + reference/)
  src/
    main.tsx  App.tsx
    engine/                   TS thuần, không React
      types.ts                NodeType, ProcessDef, Token, CaseState, EngineEvent
      process.def.ts          nodes + edges đúng 01-PROCESS-SPEC
      engine.ts               createEngine(def, deps)
      handlers/               service.ts send.ts rule.ts user.ts gateway.ts timer.ts
      rules.ts                R1–R4
      clock.ts                đồng hồ ảo (ngày làm việc)
      engine.test.ts          test headless 6 kịch bản
    data/
      scenarios.ts            S1–S5 + custom
      students.db.ts          CSDL Quản lý sinh viên (DS2) giả lập
      academic-finance.db.ts  CSDL Đào tạo & Tài chính (DS1) giả lập
      node-captions.ts        caption từ 01-PROCESS-SPEC mục 3–4
      knowledge-base.ts       tri thức cho chatbot (thủ tục, hồ sơ, SLA)
      asis.config.ts          trạm + số ngày As-Is (nhóm điền)
    ai/
      provider.ts mock.ts live.ts prompts.ts index.ts   (xem 05)
    store/
      useApp.ts               screen, role, mode, speed, flags + engine snapshot
    ui/
      shell/                  Hud, RoleTabs, CaptionCard, MiniMap, EventLog, Settings, Help
      desks/                  StudentDesk, ControlRoom, AdvisorDesk, CtsvDesk, PrincipalDesk
      map/                    BpmnMap.tsx, shapes.tsx, layout.ts, tokenAnim.ts
      kit/                    Paper, Stamp, Envelope, Typewriter, Terminal, Clock, Toast
      scenes/                 Title, ScenarioPicker, AsIs, Report
      audio/                  sfx.ts
      motion.ts
    styles/                   tokens.css, base.css
```

## 4. Engine — thiết kế
Nguyên tắc: **engine quyết định "chuyện gì xảy ra"; UI quyết định "trông thế nào và nhanh chậm ra sao"**. Engine chạy tức thì khi test, UI "phát lại" qua hàng đợi event để vừa animation vừa thuyết minh.

### 4.1 Mô hình
- `ProcessDef` = `{ nodes: Node[], edges: Edge[], lanes, pools }`, dữ liệu thuần (JSON-able). Node có `id, type, lane, name, config`.
- `NodeType`: `startMessage | startPlain | endNone | serviceTask | sendTask | businessRuleTask | userTask | gatewayXor | gatewayAnd | boundaryTimer | dataObject | dataStore`.
- **Token-based:** `Token = { id, at: nodeId, caseId, branch? }`. Cổng AND split tạo nhiều token, join chờ đủ token (`expected = 3`).
- `CaseState`: đúng các biến ở `01-PROCESS-SPEC.md` mục 5.
- `deps` (inject): `{ clock, ai: AIProvider, db: { ds1, ds2 }, random }` để test tái lập được.

### 4.2 API engine
- `createEngine(def, scenario, deps)` → `{ state, subscribe(fn), start(), step(), runUntilBlocked(), completeUserTask(taskId, outcome), advanceDays(n), reset() }`
- `step()` (async): lấy token kế sẵn sàng, chạy handler của node, phát event, đẩy token tới node tiếp theo.
- User Task: handler **đánh dấu `waiting`** và phát `task.assigned`; chỉ `completeUserTask` (hoặc Director tự gọi) mới đi tiếp.
- `advanceDays(n)`: tăng đồng hồ ảo; kiểm tra các timer đang hẹn; nếu đến hạn → phát `timer.fired`, sinh token mới vào nhánh T6 (non-interrupting: token T4 vẫn đợi).
- `reset()` dọn sạch token, state, timer, subscriber để chơi lại không rò rỉ.

### 4.3 Event (UI chỉ phụ thuộc cái này)
`case.started` · `node.entered {nodeId, tokenId}` · `node.completed` · `edge.traversed {edgeId, tokenId}` · `token.split / token.merged` · `task.assigned {nodeId, lane}` · `task.completed {outcome}` · `rule.evaluated {ruleId, passed}` · `message.sent {flowId, payload}` · `data.read / data.written {storeId}` · `dataobject.changed {id, stage}` · `timer.scheduled / timer.fired` · `ai.requested / ai.responded {touchpoint, source}` · `case.ended {endEventId, outcome}`.

### 4.4 Playback controller (UI)
- Hàng đợi event → mỗi event có `duration` do UI quyết (theo node type & `speed`).
- Chế độ **Auto**: tự chạy `step()` khi hàng đợi trống. **Step**: chờ `Space`. **Director**: Auto + tự gọi `completeUserTask` với delay & kết quả "chuẩn" từ kịch bản.
- Khi engine ở `waiting` User Task: nháy tab vai tương ứng + hiện gợi ý "Việc của bạn".

### 4.4b Đồng hồ ảo
- `clock.day` bắt đầu 0. Task tự động +0 ngày. User task ở Director cộng ngày theo cấu hình kịch bản. Nút tua gọi `advanceDays`.

## 5. Dữ liệu giả lập
- `students.db.ts` (DS2): ~8 sinh viên: `{ mssv, name, class, faculty, status: 'Đang học'|'Bảo lưu', ... }`; T10 ghi `status = 'Bảo lưu'`.
- `academic-finance.db.ts` (DS1): `{ mssv, semestersCompleted, gpaNote, discipline: 'none'|'warning'|'suspended', tuitionDebt: number, forcedWithdrawal: boolean }`.
- Mỗi kịch bản trỏ tới một MSSV trong DB; kịch bản Custom tra theo MSSV người nhập, MSSV không có → T1 báo hồ sơ không hợp lệ ("Không tìm thấy sinh viên").

## 6. Store (Zustand) — tối thiểu
`screen`, `scenarioId`, `role`, `mode`, `speed`, `muted`, `reducedMotion`, `aiMode`, `captionPinned`, `mapFullscreen`, và `engineSnapshot` (state + trạng thái node + log). UI components chỉ đọc store, không gọi trực tiếp handler engine (ngoại lệ: action `completeUserTask`).

## 7. Test (bắt buộc ở M1, chạy ở mọi milestone sau)
Vitest headless với mock AI, đồng hồ giả:
- S1 → `E_END_OK`, student status = "Bảo lưu", đúng 1 message gửi SV (MF4), đủ task T1,T3,T4,T5,T8,T9,T10,T11 đã chạy, T2/T6/T7 không chạy.
- S2 → `E_END_RETURNED`, MF2 gửi 1 lần, không có token vào G2.
- S3 → `E_END_REJECTED`, R3 fail, T4/T5 vẫn chạy trước join, MF3 gửi.
- S4 → sau `advanceDays(3)` có `timer.fired`, T6 chạy, `E_END_REMIND` đạt, T4 vẫn waiting, hoàn tất T4 xong ca vẫn đi tới `E_END_OK`.
- S5 → CTSV `invalid` → `E_END_REJECTED`.
- Custom với MSSV không tồn tại → `E_END_RETURNED`.
- Join G3 chỉ đi tiếp khi đủ 3 nhánh. `reset()` rồi chạy lại cho cùng kết quả.

## 8. Hiệu năng & ổn định
- Không timer/interval mồ côi: mọi animation/timeout gắn vòng đời component hoặc controller, hủy ở `reset()`.
- Bản đồ chỉ re-render node đổi trạng thái (memo).
- Không `localStorage` bắt buộc. Reload = về màn tiêu đề (chấp nhận được).
- Tắt được CRT flicker, particle, rung bàn nếu máy yếu (một công tắc "Chế độ nhẹ").
