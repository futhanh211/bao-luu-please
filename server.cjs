const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

let PORT = 5173;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

function createServer(port) {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

    let filePath = path.join(DIST_DIR, reqPath);

    // Prevent directory traversal
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    // SPA fallback: if file does not exist or is directory, fallback to index.html
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Server Error: ' + err.message);
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
        });
        res.end(content);
      }
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Cổng ${port} đang bận, tự động đổi sang cổng ${port + 1}...]`);
      createServer(port + 1);
    } else {
      console.error('Lỗi máy chủ:', err);
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log('====================================================================');
    console.log('       BẢO LƯU, PLEASE! - MÔ PHỎNG QUY TRÌNH TO-BE (BPMN 2.0)');
    console.log('       Trường Đại học Kinh tế - Đại học Đà Nẵng');
    console.log('====================================================================');
    console.log(`\n>>> Ứng dụng đang chạy tại: ${url}`);
    console.log('>>> Đang tự động mở trình duyệt web của bạn...');
    console.log('>>> (Khi muốn dừng chương trình, chỉ cần đóng cửa sổ màu đen này)\n');

    // Auto open browser
    const startCmd =
      process.platform === 'win32'
        ? `start ${url}`
        : process.platform === 'darwin'
        ? `open ${url}`
        : `xdg-open ${url}`;
    exec(startCmd);
  });
}

// Kiểm tra thư mục dist đã tồn tại chưa
if (!fs.existsSync(DIST_DIR)) {
  console.error('[LỖI] Chưa tìm thấy thư mục "dist/". Vui lòng chạy lệnh "npm run build" trước!');
  process.exit(1);
}

createServer(PORT);
