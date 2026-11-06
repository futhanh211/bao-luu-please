import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DocumentScanOverlay } from './DocumentScanOverlay';
import { useAppStore } from '../../store/useApp';
import { sfx } from '../audio/sfx';

describe('DocumentScanOverlay Component (Session 2)', () => {
  beforeEach(() => {
    useAppStore.setState({
      speed: 1,
      reducedMotion: false,
    });
  });

  it('1. Render bình thường khi isScanning = false: hiển thị nội dung con, không có overlay', () => {
    const html = renderToStaticMarkup(
      <DocumentScanOverlay isScanning={false}>
        <div id="preview-image">Nội dung giấy tờ minh chứng</div>
      </DocumentScanOverlay>
    );

    expect(html).toContain('id="preview-image"');
    expect(html).toContain('Nội dung giấy tờ minh chứng');
    expect(html).toContain('data-scanning="false"');
    expect(html).not.toContain('scanner-overlay-layer');
    expect(html).not.toContain('scanner-hud-bar');
  });

  it('2. Khi isScanning = true: kích hoạt HUD ngắm máy quét, lưới tọa độ và 4 góc quang học', () => {
    const html = renderToStaticMarkup(
      <DocumentScanOverlay isScanning={true} progress={20}>
        <div id="preview-doc">Ảnh chụp bệnh án</div>
      </DocumentScanOverlay>
    );

    expect(html).toContain('data-scanning="true"');
    expect(html).toContain('scanner-overlay-layer');
    expect(html).toContain('scanner-grid');
    expect(html).toContain('scanner-corner--tl');
    expect(html).toContain('scanner-corner--tr');
    expect(html).toContain('scanner-corner--bl');
    expect(html).toContain('scanner-corner--br');
    expect(html).toContain('scanner-laser-line');
    expect(html).toContain('scanner-hud-bar');
    expect(html).toContain('20%');
  });

  it('3. Hiển thị thông điệp ngữ cảnh theo từng loại giấy tờ (medical vs military vs hardship)', () => {
    // Medical
    const htmlMed = renderToStaticMarkup(
      <DocumentScanOverlay isScanning={true} progress={50} documentType="medical" />
    );
    expect(htmlMed).toContain('TRÍCH XUẤT THỰC THỂ Y KHOA');

    // Military
    const htmlMil = renderToStaticMarkup(
      <DocumentScanOverlay isScanning={true} progress={50} documentType="military" />
    );
    expect(htmlMil).toContain('TRÍCH XUẤT LỆNH GỌI &amp; ĐƠN VỊ BAN HÀNH');

    // Hardship
    const htmlHard = renderToStaticMarkup(
      <DocumentScanOverlay isScanning={true} progress={50} documentType="hardship" />
    );
    expect(htmlHard).toContain('XÁC THỰC HOÀN CẢNH');
  });

  it('4. Hỗ trợ hiển thị tên tệp và tùy biến thông điệp trạng thái statusText', () => {
    const html = renderToStaticMarkup(
      <DocumentScanOverlay
        isScanning={true}
        progress={90}
        fileName="giay_ra_vien_bv_da_khoa.jpg"
        statusText="ĐANG KIỂM TRA ĐỐI CHIẾU CHỮ KÝ..."
      />
    );

    expect(html).toContain('giay_ra_vien_bv_da_khoa.jpg');
    expect(html).toContain('ĐANG KIỂM TRA ĐỐI CHIẾU CHỮ KÝ...');
    expect(html).toContain('90%');
  });

  it('5. Chế độ giảm hiệu ứng (reducedMotion = true): tắt tia laser và animation chuyển động', () => {
    const html = renderToStaticMarkup(
      <DocumentScanOverlay isScanning={true} progress={40} reducedMotion={true} />
    );

    expect(html).toContain('data-reduced-motion="true"');
    // Khi reducedMotion bật, tia laser quét dọc và các target box không được render để chống rung mắt
    expect(html).not.toContain('scanner-laser-line');
    expect(html).not.toContain('scanner-target-box');
    // Thanh HUD trạng thái vẫn hiển thị rõ ràng và tĩnh lặng
    expect(html).toContain('scanner-hud-bar');
  });

  it('6. Phát âm thanh WebAudio quét quang học scanner_sweep và ocr_success', () => {
    const sweepSpy = vi.spyOn(sfx, 'playScannerSweep').mockImplementation(() => {});
    const successSpy = vi.spyOn(sfx, 'playOcrSuccess').mockImplementation(() => {});

    sfx.playScannerSweep();
    expect(sweepSpy).toHaveBeenCalled();

    sfx.playOcrSuccess();
    expect(successSpy).toHaveBeenCalled();

    sweepSpy.mockRestore();
    successSpy.mockRestore();
  });
});
