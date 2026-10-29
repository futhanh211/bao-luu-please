import React from 'react';

interface PaperMapIconProps {
  size?: number;
  className?: string;
}

/**
 * Biểu tượng bản đồ giấy gấp 3 nếp (Accordion Folded Paper Map)
 * Phong cách thủ công giấy tờ hành chính retro "Papers, Please",
 * có vẽ sơ đồ quy trình và các node BPMN thu nhỏ trên mặt giấy.
 */
export const PaperMapIcon: React.FC<PaperMapIconProps> = ({ size = 22, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        verticalAlign: 'middle',
        flexShrink: 0,
        filter: 'drop-shadow(1px 1px 0px rgba(0, 0, 0, 0.6))',
      }}
      aria-hidden="true"
    >
      {/* Nếp giấy trái (gấp nghiêng hướng lên) */}
      <polygon
        points="2.5,5 8.5,2 8.5,19 2.5,22"
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Nếp giấy giữa (hơi thụt lùi vào chiều sâu, bóng tối nhẹ) */}
      <polygon
        points="8.5,2 15.5,5 15.5,22 8.5,19"
        fill="var(--paper-dim)"
        stroke="var(--ink)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Nếp giấy phải (gấp nghiêng hướng lên) */}
      <polygon
        points="15.5,5 21.5,2 21.5,19 15.5,22"
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Đường nếp gấp giấy dập chỉ gãy */}
      <line
        x1="8.5"
        y1="2"
        x2="8.5"
        y2="19"
        stroke="var(--paper-line)"
        strokeWidth="0.8"
        strokeDasharray="2 1"
      />
      <line
        x1="15.5"
        y1="5"
        x2="15.5"
        y2="22"
        stroke="var(--paper-line)"
        strokeWidth="0.8"
        strokeDasharray="2 1"
      />

      {/* Sơ đồ quy trình BPMN uốn lượn trên mặt giấy */}
      <path
        d="M4.5,13.5 Q8.5,9.5 12,12.5 T17.5,7.5 T19.5,9.5"
        stroke="var(--amber)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Node Bắt đầu (Tròn - Start Event) */}
      <circle cx="4.5" cy="13.5" r="1.3" fill="var(--paper)" stroke="var(--ink)" strokeWidth="0.9" />

      {/* Node Gateway (Hình thoi - XOR Gateway ở nếp gấp giữa) */}
      <rect
        x="10.8"
        y="11.3"
        width="2.4"
        height="2.4"
        transform="rotate(45 12 12.5)"
        fill="var(--stamp-red)"
        stroke="var(--ink)"
        strokeWidth="0.8"
      />

      {/* Node Kết thúc (Tròn đậm - End Event ở nếp phải) */}
      <circle cx="19.5" cy="9.5" r="1.5" fill="var(--stamp-green)" stroke="var(--ink)" strokeWidth="1" />
    </svg>
  );
};
