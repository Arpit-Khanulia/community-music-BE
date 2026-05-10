import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOADS_DIR = path.join(__dirname, '../../downloads');

if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

const downloads = new Map();

async function getVideoInfo(url) {
  return new Promise((resolve) => {
    const args = ['--js-runtimes', 'node:/home/firedragon/.nvm/versions/node/v24.11.1/bin/node', '--cookies', path.join(__dirname, '../../cookies/youtube.txt'), '--dump-json', '--no-download', url];
    const process = spawn('yt-dlp', args);
    let output = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.on('close', () => {
      try {
        const info = JSON.parse(output);
        resolve({
          title: info.title || 'Unknown',
          thumbnail: info.thumbnail || null,
          duration: info.duration || null
        });
      } catch {
        resolve({ title: 'Unknown', thumbnail: null, duration: null });
      }
    });

    process.on('error', () => {
      resolve({ title: 'Unknown', thumbnail: null, duration: null });
    });
  });
}

export const downloadController = {
  async startDownload(req, res, next) {
    const { url, format = 'mp3', quality = '320' } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const id = uuidv4();
    const outputPath = path.join(DOWNLOADS_DIR, `${id}.%(ext)s`);

    const videoInfo = await getVideoInfo(url);

    const downloadInfo = {
      id,
      url,
      format,
      quality,
      status: 'pending',
      progress: 0,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      filePath: null,
      error: null,
      startTime: Date.now()
    };

    downloads.set(id, downloadInfo);

    const args = [
      '--js-runtimes', 'node:/home/firedragon/.nvm/versions/node/v24.11.1/bin/node',
      '--cookies', path.join(__dirname, '../../cookies/youtube.txt'),
      '-f', 'bestaudio',
      '--extract-audio',
      '--audio-format', format,
      '--audio-quality', quality === '320' ? '0' : '2',
      '-o', outputPath,
      '--progress',
      url
    ];

    const process = spawn('yt-dlp', args);
    downloadInfo.process = process;
    downloadInfo.status = 'downloading';

    let stderr = '';

    process.stdout.on('data', (data) => {
      const output = data.toString();

      const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (progressMatch) {
        downloadInfo.progress = parseFloat(progressMatch[1]);
      }
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        fs.readdirSync(DOWNLOADS_DIR).forEach(file => {
          if (file.startsWith(id)) {
            downloadInfo.filePath = path.join(DOWNLOADS_DIR, file);
            downloadInfo.status = 'completed';
            downloadInfo.progress = 100;
          }
        });

        if (!downloadInfo.filePath) {
          downloadInfo.status = 'error';
          downloadInfo.error = 'File not found after download';
        }
      } else {
        downloadInfo.status = 'error';
        downloadInfo.error = stderr || 'Download failed';
      }
    });

    process.on('error', (err) => {
      downloadInfo.status = 'error';
      downloadInfo.error = err.message;
    });

    res.json({
      success: true,
      id,
      status: 'downloading',
      title: downloadInfo.title,
      thumbnail: downloadInfo.thumbnail
    });
  },

  getStatus(req, res) {
    const { id } = req.params;
    const download = downloads.get(id);

    if (!download) {
      return res.status(404).json({ success: false, error: 'Download not found' });
    }

    res.json({
      success: true,
      id: download.id,
      status: download.status,
      progress: download.progress,
      title: download.title,
      thumbnail: download.thumbnail,
      error: download.error,
      filePath: download.filePath ? path.basename(download.filePath) : null
    });
  },

  listDownloads(req, res) {
    const list = Array.from(downloads.values()).map(d => ({
      id: d.id,
      url: d.url,
      status: d.status,
      progress: d.progress,
      title: d.title,
      thumbnail: d.thumbnail,
      error: d.error,
      filePath: d.filePath ? path.basename(d.filePath) : null,
      createdAt: d.startTime
    }));

    res.json({ success: true, downloads: list });
  },

  deleteDownload(req, res) {
    const { id } = req.params;
    const download = downloads.get(id);

    if (!download) {
      return res.status(404).json({ success: false, error: 'Download not found' });
    }

    if (download.filePath && fs.existsSync(download.filePath)) {
      fs.unlinkSync(download.filePath);
    }

    downloads.delete(id);
    res.json({ success: true, message: 'Download deleted' });
  },

  downloadFile(req, res) {
    const { id } = req.params;
    const download = downloads.get(id);

    if (!download) {
      return res.status(404).json({ success: false, error: 'Download not found' });
    }

    if (!download.filePath || !fs.existsSync(download.filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const ext = path.extname(download.filePath);
    const filename = `${download.title}${ext}`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(download.filePath);
    fileStream.pipe(res);
  }
};