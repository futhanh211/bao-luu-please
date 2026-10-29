import React from 'react';

export const TypographyTest: React.FC = () => {
  const testPhrase = 'Nguyễn Thị Phượng — Quyết định về việc nghỉ học tạm thời, ẩ ẫ ể ỗ ợ ử ự đ Đ';
  const alphabetSample = 'A Ă Â B C D Đ E Ê G H I K L M N O Ô Ơ P Q R S T U Ư V X Y';
  const vowelsSample = 'a á à ả ã ạ / ă ắ ằ ẳ ẵ ặ / â ấn ầ ẩ ẫ ậ / e é è ẻ ẽ ẹ / ê ế ề ể ễ ệ / i í ì ỉ ĩ ị / o ó ò ỏ õ ọ / ô ố ồ ổ ỗ ộ / ơ ớ ờ ở ỡ ợ / u ú ù ủ ũ ụ / ư ứ ừ ử ữ ự / y ý ỳ ỷ ỹ ỵ / đ Đ';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--desk-900)',
        color: 'var(--paper)',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ maxWidth: '1000px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-paper)',
                fontSize: '28px',
                color: 'var(--amber)',
                marginBottom: '6px',
              }}
            >
              KIỂM THỬ TYPOGRAPHY & DẤU TIẾNG VIỆT
            </h1>
            <p style={{ color: 'var(--paper-dim)', fontSize: '15px' }}>
              Kiểm tra khả năng hiển thị bộ dấu tiếng Việt cho 3 vai trò font chữ offline
            </p>
          </div>

          <a
            href="/"
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--desk-700)',
              color: 'var(--paper)',
              fontFamily: 'var(--font-paper)',
              fontSize: '15px',
              border: '1px solid var(--desk-500)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            ← Về ứng dụng chính
          </a>
        </div>

        {/* 1. Paper Font */}
        <section
          style={{
            backgroundColor: 'var(--paper)',
            color: 'var(--ink)',
            padding: '24px 30px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-paper)',
            border: '1px solid var(--paper-line)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--paper-line)', paddingBottom: '8px', marginBottom: '14px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', color: 'var(--stamp-blue)' }}>
              1. Văn bản giấy tờ / Đơn (--font-paper: IBM Plex Mono)
            </span>
            <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
              (Đã chọn IBM Plex Mono do Courier Prime thiếu subset tiếng Việt)
            </span>
          </div>

          <p style={{ fontFamily: 'var(--font-paper)', fontSize: '20px', lineHeight: 1.6, marginBottom: '12px', fontWeight: 600 }}>
            {testPhrase}
          </p>

          <p style={{ fontFamily: 'var(--font-paper)', fontSize: '15px', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            Bảng dấu: {vowelsSample}
          </p>
          <p style={{ fontFamily: 'var(--font-paper)', fontSize: '14px', color: 'var(--ink-soft)', marginTop: '4px' }}>
            Chữ hoa: {alphabetSample}
          </p>
        </section>

        {/* 2. HUD / CRT Font */}
        <section
          className="crt-screen"
          style={{
            padding: '24px 30px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            border: '1px solid var(--crt-dim)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--crt-dim)', paddingBottom: '8px', marginBottom: '14px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', color: 'var(--amber)' }}>
              2. Khung HUD / Terminal hệ thống (--font-hud: VT323)
            </span>
            <span style={{ fontSize: '13px', color: 'var(--crt-dim)' }}>
              Subset: latin, latin-ext, vietnamese
            </span>
          </div>

          <p style={{ fontFamily: 'var(--font-hud)', fontSize: '26px', lineHeight: 1.5, marginBottom: '12px', letterSpacing: '0.5px' }}>
            {testPhrase}
          </p>

          <p style={{ fontFamily: 'var(--font-hud)', fontSize: '20px', color: 'var(--crt-fg)', opacity: 0.85, lineHeight: 1.5 }}>
            Bảng dấu: {vowelsSample}
          </p>
          <p style={{ fontFamily: 'var(--font-hud)', fontSize: '18px', color: 'var(--crt-fg)', opacity: 0.85, marginTop: '4px' }}>
            Chữ hoa: {alphabetSample}
          </p>
        </section>

        {/* 3. Read Font */}
        <section
          style={{
            backgroundColor: 'var(--desk-700)',
            color: 'var(--paper)',
            padding: '24px 30px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            border: '1px solid var(--desk-500)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--desk-500)', paddingBottom: '8px', marginBottom: '14px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', color: 'var(--amber)' }}>
              3. Nội dung đọc dài / Caption / AI Chat (--font-read: Be Vietnam Pro)
            </span>
            <span style={{ fontSize: '12px', color: 'var(--paper-dim)' }}>
              Subset: latin, latin-ext, vietnamese
            </span>
          </div>

          <p style={{ fontFamily: 'var(--font-read)', fontSize: '19px', lineHeight: 1.6, marginBottom: '12px' }}>
            {testPhrase}
          </p>

          <p style={{ fontFamily: 'var(--font-read)', fontSize: '15px', color: 'var(--paper-dim)', lineHeight: 1.6 }}>
            Bảng dấu: {vowelsSample}
          </p>
          <p style={{ fontFamily: 'var(--font-read)', fontSize: '14px', color: 'var(--paper-dim)', marginTop: '4px' }}>
            Chữ hoa: {alphabetSample}
          </p>
        </section>

        {/* Courier Prime reference */}
        <section
          style={{
            backgroundColor: 'var(--desk-900)',
            color: 'var(--paper-dim)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--desk-500)',
            fontSize: '14px',
            marginBottom: '32px',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '6px', color: 'var(--stamp-red)' }}>
            Ghi chú đối chiếu: Courier Prime
          </div>
          <p style={{ fontFamily: 'Courier Prime, monospace', fontSize: '15px', marginBottom: '6px' }}>
            Courier Prime: {testPhrase}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--paper-dim)' }}>
            Lưu ý: Package <code>@fontsource/courier-prime</code> chỉ hỗ trợ latin/latin-ext và thiếu subset tiếng Việt chính thức, dẫn đến các nguyên âm có dấu thanh phức tạp (ẩ, ẫ, ể, ỗ, ợ, ử, ự) bị lệch glyph. Dự án đã tự động chuẩn hóa vai trò văn bản giấy tờ sang <code>IBM Plex Mono</code> theo đúng chỉ đạo trong spec.
          </p>
        </section>

        {/* 4. Bureaucratic Cursor Set Showroom */}
        <section
          style={{
            backgroundColor: 'var(--desk-700)',
            border: '2px solid var(--amber)',
            borderRadius: 'var(--radius-sm)',
            padding: '24px 28px',
            boxShadow: 'var(--shadow-paper-lg)',
          }}
        >
          <div style={{ borderBottom: '1px solid var(--desk-500)', paddingBottom: '10px', marginBottom: '18px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-paper)',
                fontSize: '22px',
                color: 'var(--amber)',
                margin: 0,
                letterSpacing: '1px',
              }}
            >
              4. BỘ CON TRỎ CÔNG SỞ ĐỘC BẢN (Bureaucratic Cursor Set)
            </h2>
            <p style={{ color: 'var(--paper-dim)', fontSize: '14px', marginTop: '4px' }}>
              Rê chuột và nhấn thử vào các ô tiêu bản dưới đây để kiểm tra trực tiếp trạng thái con trỏ vector SVG:
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Specimen 1: Default Arrow */}
            <div
              style={{
                backgroundColor: 'var(--desk-900)',
                border: '1px solid var(--desk-500)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'var(--cursor-default)',
              }}
            >
              <div style={{ color: 'var(--amber)', fontFamily: 'var(--font-paper)', fontWeight: 700, fontSize: '14px' }}>
                Mũi tên công chức retro
              </div>
              <div style={{ color: 'var(--paper-dim)', fontSize: '12px', marginTop: '4px' }}>
                Góc cạnh thước kẻ, viền giấy kem, sống lưng vàng, bóng cứng nổi khối.
              </div>
              <div style={{ fontSize: '11px', color: 'var(--crt-dim)', marginTop: '8px' }}>
                Hotspot: <code>0 0</code> · Biến: <code>--cursor-default</code>
              </div>
            </div>

            {/* Specimen 2: Manicule */}
            <div
              style={{
                backgroundColor: 'var(--paper)',
                color: 'var(--ink)',
                border: '1px solid var(--paper-line)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'var(--cursor-pointer)',
              }}
            >
              <div style={{ color: 'var(--stamp-blue)', fontFamily: 'var(--font-paper)', fontWeight: 700, fontSize: '14px' }}>
                Bàn tay Manicule ☞
              </div>
              <div style={{ color: 'var(--ink-soft)', fontSize: '12px', marginTop: '4px' }}>
                Chỉ ngón trỏ công văn cổ điển, măng-sét trắng, tay áo olive & khuy đồng.
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '8px' }}>
                Hotspot: <code>5 1</code> · Biến: <code>--cursor-pointer</code>
              </div>
            </div>

            {/* Specimen 3: Stamp */}
            <div
              style={{
                backgroundColor: 'var(--desk-900)',
                border: '2px solid var(--stamp-red)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'var(--cursor-stamp)',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.cursor = 'var(--cursor-stamp-active)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.cursor = 'var(--cursor-stamp)';
              }}
            >
              <div style={{ color: 'var(--stamp-red)', fontFamily: 'var(--font-paper)', fontWeight: 700, fontSize: '14px' }}>
                Cán con dấu dập gỗ (Nhấn giữ!)
              </div>
              <div style={{ color: 'var(--paper-dim)', fontSize: '12px', marginTop: '4px' }}>
                Cán gỗ gụ tiện tròn, khấc đồng, đế dập mực đỏ. Nhấn chuột để thấy lún mực!
              </div>
              <div style={{ fontSize: '11px', color: 'var(--crt-dim)', marginTop: '8px' }}>
                Hotspot: <code>16 28</code> · Biến: <code>--cursor-stamp</code>
              </div>
            </div>

            {/* Specimen 4: Pen */}
            <div
              style={{
                backgroundColor: 'var(--paper)',
                color: 'var(--ink)',
                border: '1px solid var(--amber)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'var(--cursor-pen)',
              }}
            >
              <div style={{ color: 'var(--amber)', fontFamily: 'var(--font-paper)', fontWeight: 700, fontSize: '14px' }}>
                Ngòi bút máy Ban Giám Hiệu
              </div>
              <div style={{ color: 'var(--ink-soft)', fontSize: '12px', marginTop: '4px' }}>
                Ngòi bút mạ vàng hai tông, rãnh xẻ mực, góc 45° sắc nét phục vụ ký duyệt.
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '8px' }}>
                Hotspot: <code>1 1</code> · Biến: <code>--cursor-pen</code>
              </div>
            </div>

            {/* Specimen 5: Loupe */}
            <div
              style={{
                backgroundColor: 'var(--desk-900)',
                border: '1px solid var(--crt-fg)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'var(--cursor-inspect)',
              }}
            >
              <div style={{ color: 'var(--crt-fg)', fontFamily: 'var(--font-paper)', fontWeight: 700, fontSize: '14px' }}>
                Kính lúp kiểm tra CTSV
              </div>
              <div style={{ color: 'var(--paper-dim)', fontSize: '12px', marginTop: '4px' }}>
                Vành đồng, tròng phản quang xanh, tâm ngắm hồng tâm soi từng con số hồ sơ.
              </div>
              <div style={{ fontSize: '11px', color: 'var(--crt-dim)', marginTop: '8px' }}>
                Hotspot: <code>11 11</code> · Biến: <code>--cursor-inspect</code>
              </div>
            </div>

            {/* Specimen 6: Grab & Grabbing */}
            <div
              style={{
                backgroundColor: 'var(--paper-dim)',
                color: 'var(--ink)',
                border: '1px solid var(--paper-line)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'var(--cursor-grab)',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.cursor = 'var(--cursor-grabbing)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.cursor = 'var(--cursor-grab)';
              }}
            >
              <div style={{ color: 'var(--ink)', fontFamily: 'var(--font-paper)', fontWeight: 700, fontSize: '14px' }}>
                Kẹp giấy / Pan bản đồ (Nhấn giữ!)
              </div>
              <div style={{ color: 'var(--ink-soft)', fontSize: '12px', marginTop: '4px' }}>
                Bàn tay mở kẹp mép tài liệu. Nhấn giữ chuột để nắm chặt giấy.
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '8px' }}>
                Hotspot: <code>10 10</code> · Biến: <code>--cursor-grab / grabbing</code>
              </div>
            </div>

            {/* Specimen 7: Not allowed */}
            <div
              style={{
                backgroundColor: 'var(--desk-900)',
                border: '1px dashed var(--stamp-red)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'var(--cursor-not-allowed)',
              }}
            >
              <div style={{ color: 'var(--stamp-red)', fontFamily: 'var(--font-paper)', fontWeight: 700, fontSize: '14px' }}>
                Con dấu khước từ [✕]
              </div>
              <div style={{ color: 'var(--paper-dim)', fontSize: '12px', marginTop: '4px' }}>
                Dấu mộc đỏ thô ráp nghiêng nhẹ, thể hiện nút bị khóa hoặc ngoài thẩm quyền.
              </div>
              <div style={{ fontSize: '11px', color: 'var(--crt-dim)', marginTop: '8px' }}>
                Hotspot: <code>16 16</code> · Biến: <code>--cursor-not-allowed</code>
              </div>
            </div>

            {/* Specimen 8: Typewriter Bar */}
            <div
              style={{
                backgroundColor: 'var(--paper)',
                color: 'var(--ink)',
                border: '1px solid var(--paper-line)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'var(--cursor-text)',
              }}
            >
              <div style={{ color: 'var(--ink)', fontFamily: 'var(--font-paper)', fontWeight: 700, fontSize: '14px' }}>
                Thước gá máy đánh chữ
              </div>
              <div style={{ color: 'var(--ink-soft)', fontSize: '12px', marginTop: '4px' }}>
                Thanh ép giấy và khấc vạch đo cơ học dùng cho các ô điền đơn từ.
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '8px' }}>
                Hotspot: <code>16 15</code> · Biến: <code>--cursor-text</code>
              </div>
            </div>

            {/* Specimen 9: Regulatory Help */}
            <div
              style={{
                backgroundColor: 'var(--desk-900)',
                border: '1px solid var(--stamp-blue)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'var(--cursor-help)',
              }}
            >
              <div style={{ color: 'var(--stamp-blue)', fontFamily: 'var(--font-paper)', fontWeight: 700, fontSize: '14px' }}>
                Tem mộc hỏi đáp quy chế (?)
              </div>
              <div style={{ color: 'var(--paper-dim)', fontSize: '12px', marginTop: '4px' }}>
                Con mộc tròn xanh mang dấu hỏi phong cách tài liệu lưu trữ cổ.
              </div>
              <div style={{ fontSize: '11px', color: 'var(--crt-dim)', marginTop: '8px' }}>
                Hotspot: <code>10 10</code> · Biến: <code>--cursor-help</code>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
