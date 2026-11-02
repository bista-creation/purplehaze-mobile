const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || !path.extname(reqPath)) {
    reqPath = '/index.html';
  }
  const filePath = path.join(DIST_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const indexPath = path.join(DIST_DIR, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(indexPath).pipe(res);
  }
});

function runChromeAsync(chromePath, args) {
  return new Promise((resolve, reject) => {
    execFile(chromePath, args, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

const PORT = 8089;
server.listen(PORT, async () => {
  console.log(`Static server running at http://localhost:${PORT}`);

  const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  console.log(`Using Chrome binary: ${chromePath}`);

  const screenshots = [
    {
      file: 'android-menu-screen.png',
      width: 412,
      height: 915,
      url: `http://localhost:${PORT}/menu`,
    },
    {
      file: 'ios-menu-screen.png',
      width: 393,
      height: 852,
      url: `http://localhost:${PORT}/menu`,
    },
    {
      file: 'android-reservations-screen.png',
      width: 412,
      height: 915,
      url: `http://localhost:${PORT}/reservations`,
    },
    {
      file: 'ios-venues-screen.png',
      width: 393,
      height: 852,
      url: `http://localhost:${PORT}/venues`,
    },
    {
      file: 'ios-profile-screen.png',
      width: 393,
      height: 852,
      url: `http://localhost:${PORT}/profile`,
    },
    {
      file: 'android-profile-screen.png',
      width: 412,
      height: 915,
      url: `http://localhost:${PORT}/profile`,
    },
    {
      file: 'ios-login-modal.png',
      width: 393,
      height: 852,
      url: `http://localhost:${PORT}/login`,
    },
    {
      file: 'ios-maya-modal.png',
      width: 393,
      height: 852,
      url: `http://localhost:${PORT}/maya`,
    },
  ];

  for (const item of screenshots) {
    const outPath = path.join(OUTPUT_DIR, item.file);
    console.log(`Capturing ${item.file} [${item.width}x${item.height}] from ${item.url}...`);

    try {
      await runChromeAsync(chromePath, [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--virtual-time-budget=2500',
        `--window-size=${item.width},${item.height}`,
        `--screenshot=${outPath}`,
        item.url,
      ]);
      console.log(`Captured successfully: ${outPath}`);

      const artifactDir = 'C:\\Users\\bista\\.gemini\\antigravity\\brain\\79d61ea4-44e6-48a3-bb44-a27587922187\\screenshots';
      if (fs.existsSync(artifactDir)) {
        fs.copyFileSync(outPath, path.join(artifactDir, item.file));
      }
    } catch (err) {
      console.error(`Error capturing ${item.file}:`, err.message);
    }
  }

  server.close(() => {
    console.log('Finished capturing all screenshots.');
    process.exit(0);
  });
});
