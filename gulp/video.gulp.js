const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const https = require('https');

/* -------------------------------------------------------------------------- */
/*                             Product overview video                         */
/* -------------------------------------------------------------------------- */

/**
 * Put the overview recording where the landing page expects it.
 *
 * The landing page plays /docs/video/overview.mp4. The file is ~50 MB, so it is not in
 * git — but it cannot simply be uploaded to S3 once either: the frontend deploy runs
 * `aws s3 sync build/ --delete`, which removes anything not present in build/. So the
 * file has to exist at build time on every deploy, and this task is what guarantees it.
 *
 * The source is the Loom share link, fetched through the same public endpoint Loom's own
 * share page calls. Nothing here is authenticated; if the recording is ever made private
 * this stops working, which is why the failure below is soft.
 */

const LOOM_SESSION = process.env.OVERVIEW_LOOM_ID || 'be36e76dd2e2460b818d6b45158a9341';
const TARGET = path.join('public', 'docs', 'video', 'overview.mp4');
// A truncated download is worse than none: the page's fallback never fires, and the
// viewer gets a player that dies part-way through. Anything this small is not the video.
const MIN_BYTES = 1024 * 1024;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36';

function post(url, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': UA,
          Origin: 'https://www.loom.com',
          Referer: `https://www.loom.com/share/${LOOM_SESSION}`
        }
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () =>
          response.statusCode === 200
            ? resolve(Buffer.concat(chunks).toString())
            : reject(new Error(`HTTP ${response.statusCode} asking Loom for the video URL`))
        );
      }
    );
    request.on('error', reject);
    request.end(body);
  });
}

function download(url, destination) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': UA } }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          response.resume();
          return download(response.headers.location, destination).then(resolve, reject);
        }
        if (response.statusCode !== 200) {
          response.resume();
          return reject(new Error(`HTTP ${response.statusCode} downloading the video`));
        }
        // Write to a temp name and rename at the end, so an interrupted run cannot leave
        // a half-file behind that the next build mistakes for a complete one.
        const temporary = `${destination}.part`;
        const file = fs.createWriteStream(temporary);
        response.pipe(file);
        file.on('finish', () =>
          file.close(() => {
            fs.renameSync(temporary, destination);
            resolve(fs.statSync(destination).size);
          })
        );
        file.on('error', (error) => {
          fs.rmSync(temporary, { force: true });
          reject(error);
        });
      })
      .on('error', reject);
  });
}

gulp.task('video', async () => {
  fs.mkdirSync(path.dirname(TARGET), { recursive: true });

  if (fs.existsSync(TARGET) && fs.statSync(TARGET).size >= MIN_BYTES) {
    console.log(`video: ${TARGET} already present, skipping download`);
    return;
  }

  try {
    const payload = await post(
      `https://www.loom.com/api/campaigns/sessions/${LOOM_SESSION}/transcoded-url`,
      '{}'
    );
    const { url } = JSON.parse(payload);
    if (!url) throw new Error('Loom returned no URL for this session');
    const bytes = await download(url, TARGET);
    if (bytes < MIN_BYTES) throw new Error(`downloaded only ${bytes} bytes`);
    console.log(`video: fetched ${(bytes / 1024 / 1024).toFixed(1)} MB to ${TARGET}`);
  } catch (error) {
    // Never fail the build over this. The landing page detects the missing file and
    // offers the Loom link instead, so the deploy is still correct without it — just
    // one click slower for the viewer.
    console.warn(`video: could not fetch the overview recording — ${error.message}`);
    console.warn('video: the landing page will fall back to the Loom link.');
  }
});
