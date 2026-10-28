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
      </div>
    </div>
  );
};
