# 03 · UI/UX DESIGN — Nhận diện, bố cục, animation, âm thanh

## 1. Phong cách
"Văn phòng quan liêu hậu-Xô-viết nhưng làm lại cho Việt Nam số hóa": bàn gỗ/olive tối, giấy ngả vàng, chữ đánh máy, con dấu mực đỏ/xanh, CRT xanh lá cho hệ thống. **Không** pixel art (khó làm tốt, dễ vỡ); dùng giấy-CSS/SVG phẳng có kết cấu nhẹ. Lấy cảm hứng, không sao chép asset của game gốc.
Tông cảm xúc: hơi châm biếm, nghiêm túc đủ để nói chuyện quy trình thật.

## 2. Design tokens (đặt trong `src/styles/tokens.css`)
- Nền bàn: `--desk-900: #23231d`, `--desk-700: #34342b`, `--desk-500: #4a4a3d`
- Giấy: `--paper: #e9e3cf`, `--paper-dim: #d8d0b6`, `--paper-line: #b9b093`
- Mực: `--ink: #1d1d19`, `--ink-soft: #4a4a40`
- Con dấu đỏ: `--stamp-red: #b3261e`; dấu xanh: `--stamp-green: #2e6b3a`; dấu xanh dương số hóa: `--stamp-blue: #27508a`
- Nhấn vàng (điền tự động / cảnh báo): `--amber: #d9a441`
- CRT hệ thống: `--crt-bg: #0c1a10`, `--crt-fg: #7fe08a`, `--crt-dim: #3d7a46`
- Màu lane (nhạt, dùng trên bản đồ): L1 hệ thống `#2c4a3a`, L2 cố vấn `#4a3f2c`, L3 CTSV `#3a3a52`, L4 BGH `#52342f`, Pool SV `#2c3b4a`
- Bo góc nhỏ (2–4px), bóng đổ cứng (offset, không blur) để ra cảm giác giấy dán.
- Texture: noise bằng SVG `feTurbulence` (inline data URI), scanline CRT bằng `repeating-linear-gradient` opacity ≤ 0.08.

## 3. Typography (offline, qua `@fontsource`)
Máy chiếu → cỡ chữ tối thiểu 18px, tiêu đề 28–48px.
- Văn bản giấy tờ / đơn: **Courier Prime** (hoặc **IBM Plex Mono** nếu Courier Prime lỗi dấu).
- Khung HUD / terminal hệ thống: **VT323** hoặc **IBM Plex Mono**.
- Nội dung đọc dài (chat AI, caption): **Be Vietnam Pro**.
- BẮT BUỘC import đủ subset `latin`, `latin-ext`, `vietnamese` của từng font. Tạo trang test `?typography` hiển thị: "Nguyễn Thị Phượng — Quyết định về việc nghỉ học tạm thời, ẩ ẫ ể ỗ ợ ử ự đ Đ". Font nào lỗi dấu thì thay, không để lọt.

## 4. Bố cục chính (mục tiêu 1920×1080, co được xuống 1366×768)
- **HUD trên cùng (64px):** logo "BẢO LƯU, PLEASE" · Mã ca · Ngày giả lập (Ngày N) · Thanh vai [Sinh viên · Hệ thống · Cố vấn · CTSV · BGH] có chấm nhấp nháy khi có việc · Chế độ [Play/Step/Director] · Tốc độ · Âm thanh · AI: MOCK/LIVE · Reset.
- **Vùng bàn (trung tâm):** cảnh của vai đang chọn, bố cục "nhìn từ trên xuống" với các tờ giấy xếp chồng.
- **Mini-map BPMN (góc phải dưới, 360×220):** luôn thấy; bấm hoặc phím `B` để phóng to toàn màn hình.
- **Caption card (trái dưới):** hiện khi một node chạy: tên node, loại ký hiệu (icon), "Vì sao tự động hóa" + "Vì sao ký hiệu này"; tự ẩn sau ~6s, ghim được bằng `P`. Cỡ chữ lớn để cả lớp đọc.
- **Nhật ký sự kiện (kéo ra từ cạnh phải):** danh sách event, bấm vào nhảy tới node.
- Màn tiêu đề → Chọn kịch bản → Bàn làm việc → Báo cáo cuối ca. Chuyển cảnh bằng "kéo cửa chớp / cuộn giấy" 400ms.

## 5. Bản đồ BPMN — quy tắc vẽ (SVG tự code, KHÔNG dùng bpmn-js)
- Vị trí node đặt tay trong `src/ui/map/layout.ts` (deterministic). Hai Pool xếp dọc: Pool SV ở trên, Pool Trường ở dưới với 4 lane ngang.
- Hình theo chuẩn BPMN:
  - Task: chữ nhật bo góc + icon nhỏ góc trái trên: Service = bánh răng, Send = phong bì đặc, Business Rule = bảng, User = hình người.
  - Gateway: hình thoi, XOR = dấu X, AND = dấu +.
  - Start: vòng mảnh (Message Start có phong bì bên trong). End: vòng đậm. Boundary Timer: vòng đôi nét đứt có đồng hồ, bám cạnh T4.
  - Data Object: tờ giấy gập góc; Data Store: hình trụ. Message Flow: nét đứt, đầu vòng + mũi tên rỗng. Sequence Flow: nét liền mũi tên đặc.
- Trạng thái node: `idle` xám mờ · `active` viền sáng + glow · `done` đổ màu lane đậm + tick nhỏ · `skipped` (nhánh không đi) mờ gạch chéo.
- Token: chấm sáng + vệt đuôi chạy theo path (dùng `getPointAtLength` hoặc `offset-path`), 1 token = 1 hồ sơ; G2 tách thành 3 chấm.
- Nếu nhóm có ảnh sơ đồ BPMN gốc, bỏ vào `docs/reference/bpmn-diagram.png` để agent bám sát bố cục.

## 6. Thông số animation (đặt hằng số trong `src/ui/motion.ts`; nhân với `1/speed`)
- Giấy trượt vào: 450ms ease-out, từ phải, xoay −3° → −1°.
- Con dấu: bay xuống scale 1.6→1 trong 120ms, bàn rung 6px × 150ms, mực loang (scale 0.9→1.05 + blur giảm) 300ms, rồi giữ nghiêng ngẫu nhiên ±4°.
- Token chạy 1 cạnh: 600–900ms theo độ dài cạnh; tại node dừng `animMs` riêng theo loại (Service ~900ms, Send ~700ms, Rule ~1400ms, User = chờ người).
- Split G2: token vỡ 3 nhánh 350ms; Join G3: 3 chấm hội tụ + chớp trắng 200ms.
- Phong bì (Send): bay theo cung Bézier từ node sang hộp thư SV 800ms, thư "rơi" vào hộp.
- Timer: kim đồng hồ quay nhanh khi tua ngày, chuông rung 600ms khi bắn.
- Chữ ký số: `stroke-dashoffset` vẽ 1200ms + dấu đỏ chát.
- Chữ AI: máy đánh chữ 25–35ms/ký tự; có dấu "đang suy nghĩ…" 3 chấm.
- Số liệu: đếm lăn 400ms. CRT: nhấp nháy rất nhẹ, tắt được.
- Tôn trọng `prefers-reduced-motion` và công tắc "Giảm hiệu ứng" trong cài đặt (còn đủ tín hiệu: đổi màu, không rung).

## 7. Âm thanh (WebAudio synth, KHÔNG file mp3)
`src/ui/audio/sfx.ts` sinh: chát con dấu (sine thấp + noise ngắn), giấy sột soạt (noise lọc), gõ máy chữ (click nhẹ), chuông (tổng hòa sin), buzz lỗi, chime thành công, tiếng "bíp" CRT khi service chạy.
Mặc định **TẮT** (an toàn khi lên chiếu); màn tiêu đề có gợi ý "Bấm M để bật âm thanh". Âm lượng tối đa 40%.

## 8. Phím tắt (hiện trong menu "?")
- `1`–`5`: chuyển bàn (SV, Hệ thống, Cố vấn, CTSV, BGH) · `B`: bản đồ toàn màn hình · `Space`: bước tiếp / tạm dừng · `D`: Director · `S`: Step · `T`: tua +1 ngày (`Shift+T` +3 ngày) · `+`/`-`: tốc độ · `P`: ghim caption · `M`: âm thanh · `R`: reset ca · `F`: toàn màn hình · `?`: trợ giúp.

## 9. Trạng thái rỗng / lỗi (ai cũng quên)
- Chưa chọn kịch bản: màn tiêu đề rõ ràng. Ca kết thúc: khóa thao tác, hiện báo cáo.
- AI lỗi/timeout: badge chuyển "MOCK (fallback)", không hiện lỗi đỏ giữa buổi thuyết trình.
- Thao tác sai thứ tự (bấm bàn chưa có việc): hiện giấy ghi "Bàn này chưa có hồ sơ".
