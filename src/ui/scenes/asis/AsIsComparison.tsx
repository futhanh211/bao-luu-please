import React from 'react';

export const AsIsComparison: React.FC = () => {
  return (
    <div className="asis-comparison-board">
      <div className="asis-comparison-head">
        <span className="asis-comparison-title">
          <span>⚖️</span>
          BẢNG ĐỐI SOÁT HIỆU NĂNG: QUY TRÌNH HIỆN HÀNH (AS-IS) VS SỐ HÓA (TO-BE)
        </span>
        <div className="asis-metric-pills">
          <span className="asis-metric-pill">
            ⏱ Thời gian: <strong>22 ngày ➔ 3-4 ngày (-88%)</strong>
          </span>
          <span className="asis-metric-pill">
            🤖 Tự động hóa: <strong>0% ➔ 72,7% (8/11 tác vụ)</strong>
          </span>
        </div>
      </div>

      <div className="asis-comparison-cols">
        {/* Cột As-Is */}
        <div className="asis-col-asis">
          <div className="asis-col-title-asis">
            <span>❌</span>
            <span>QUY TRÌNH AS-IS (TRUYỀN THỐNG - GIẤY)</span>
          </div>
          <div className="asis-bullet-row">
            <span className="asis-bullet-icon">⏱</span>
            <span>
              <strong>Thời gian:</strong> 22 ngày làm việc (~1 tháng thực tế)
            </span>
          </div>
          <div className="asis-bullet-row">
            <span className="asis-bullet-icon">📄</span>
            <span>
              <strong>Hình thức:</strong> 100% giấy tờ in ấn, kẹp ghim, 4 lần ký tay, 2 con dấu mộc
            </span>
          </div>
          <div className="asis-bullet-row">
            <span className="asis-bullet-icon">🚶</span>
            <span>
              <strong>Di chuyển:</strong> Sinh viên trực tiếp đi lại 5 tòa nhà/phòng ban trong trường
            </span>
          </div>
          <div className="asis-bullet-row">
            <span className="asis-bullet-icon">⛔</span>
            <span>
              <strong>Tiến trình:</strong> Tuần tự hoàn toàn; dễ ách tắc khi nhân sự bận hoặc vắng mặt
            </span>
          </div>
        </div>

        {/* Cột To-Be */}
        <div className="asis-col-tobe">
          <div className="asis-col-title-tobe">
            <span>✅</span>
            <span>QUY TRÌNH TO-BE (HỆ THỐNG "BẢO LƯU, PLEASE")</span>
          </div>
          <div className="asis-bullet-row">
            <span className="asis-bullet-icon">⚡</span>
            <span>
              <strong>Thời gian:</strong> 3–4 ngày giả lập (rút ngắn hơn 80% thời gian chờ đợi)
            </span>
          </div>
          <div className="asis-bullet-row">
            <span className="asis-bullet-icon">🤖</span>
            <span>
              <strong>Tự động hóa:</strong> 72,7% (8/11 tác vụ máy xử lý tự động: duyệt, tính phí, cấp số)
            </span>
          </div>
          <div className="asis-bullet-row">
            <span className="asis-bullet-icon">🏠</span>
            <span>
              <strong>Tiếp nhận:</strong> 1 cổng dịch vụ công trực tuyến 24/7, nộp tại nhà
            </span>
          </div>
          <div className="asis-bullet-row">
            <span className="asis-bullet-icon">🔀</span>
            <span>
              <strong>Song song:</strong> Kích hoạt đồng thời T3, T4, T5; Ký số điện tử PKI tập trung
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
