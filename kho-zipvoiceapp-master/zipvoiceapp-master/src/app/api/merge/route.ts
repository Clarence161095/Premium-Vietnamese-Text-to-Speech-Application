import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Parse a minimal WAV header and return { fmt, dataOffset, dataLength, buffer }
function parseWav(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  // 'RIFF'
  if (view.getUint32(0, false) !== 0x52494646) throw new Error('Invalid WAV: missing RIFF');
  // 'WAVE'
  if (view.getUint32(8, false) !== 0x57415645) throw new Error('Invalid WAV: missing WAVE');

  let offset = 12;
  let fmt: { audioFormat: number; numChannels: number; sampleRate: number; byteRate: number; blockAlign: number; bitsPerSample: number } | null = null;
  let dataOffset = -1;
  let dataLength = -1;

  while (offset + 8 <= view.byteLength) {
    const chunkId = view.getUint32(offset, false);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;

    // 'fmt '
    if (chunkId === 0x666d7420) {
      const audioFormat = view.getUint16(chunkStart + 0, true);
      const numChannels = view.getUint16(chunkStart + 2, true);
      const sampleRate = view.getUint32(chunkStart + 4, true);
      const byteRate = view.getUint32(chunkStart + 8, true);
      const blockAlign = view.getUint16(chunkStart + 12, true);
      const bitsPerSample = view.getUint16(chunkStart + 14, true);
      fmt = { audioFormat, numChannels, sampleRate, byteRate, blockAlign, bitsPerSample };
    }
    // 'data'
    else if (chunkId === 0x64617461) {
      dataOffset = chunkStart;
      dataLength = chunkSize;
    }

    offset = chunkStart + chunkSize + (chunkSize % 2); // padding
  }

  if (!fmt) throw new Error('Invalid WAV: missing fmt chunk');
  if (dataOffset < 0 || dataLength < 0) throw new Error('Invalid WAV: missing data chunk');

  return { fmt, dataOffset, dataLength, buffer };
}

function buildWavHeader(totalDataLength: number, fmt: { numChannels: number; sampleRate: number; bitsPerSample: number }) {
  const bytesPerSample = fmt.bitsPerSample / 8;
  const blockAlign = fmt.numChannels * bytesPerSample;
  const byteRate = fmt.sampleRate * blockAlign;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // 'RIFF'
  view.setUint32(4, 36 + totalDataLength, true); // file size - 8
  view.setUint32(8, 0x57415645, false); // 'WAVE'

  // fmt chunk
  view.setUint32(12, 0x666d7420, false); // 'fmt '
  view.setUint32(16, 16, true); // PCM fmt chunk size
  view.setUint16(20, 1, true); // audio format PCM
  view.setUint16(22, fmt.numChannels, true);
  view.setUint32(24, fmt.sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, fmt.bitsPerSample, true);

  // data chunk
  view.setUint32(36, 0x64617461, false); // 'data'
  view.setUint32(40, totalDataLength, true);

  return header;
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const files = form.getAll('files') as File[];
    const outName = (form.get('outputName') as string | null)?.trim() || `merged_${Date.now()}.wav`;
    const saveFlag = ((form.get('save') as string | null) || '').toLowerCase() === 'true';
    const deletePaths = (form.getAll('deletePaths') as string[]).filter(Boolean);
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Thiếu danh sách files' }, { status: 400 });
    }

    // Try using ffmpeg first to robustly standardize (mono, s16) and resample, then concat
    async function tryFfmpegConcat(): Promise<Uint8Array | null> {
      return await new Promise(async (resolve) => {
        // quick check ffmpeg availability
        const ffbin = process.env.FFMPEG_PATH || (process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
        const check = spawn(ffbin, ['-version']);
        let available = true;
        check.on('error', () => { available = false; resolve(null); });
        check.on('close', async (code) => {
          if (!available || code !== 0) { resolve(null); return; }
          try {
            const tmpDir = path.join(process.cwd(), 'output', `.merge_tmp_${Date.now()}`);
            fs.mkdirSync(tmpDir, { recursive: true });
            // Choose a target sample rate (default 24000). You can change via ENV MERGE_TARGET_RATE
            const targetRate = parseInt(process.env.MERGE_TARGET_RATE || '24000', 10) || 24000;
            // Loudness normalization target (EBU R128), default -16 LUFS suitable for web
            const targetLufs = parseInt(process.env.MERGE_TARGET_LUFS || '-16', 10) || -16;
            // Write inputs and standardize each to wav s16 mono at target rate
            const stdPaths: string[] = [];
            for (let i = 0; i < files.length; i++) {
              const ab = await files[i].arrayBuffer();
              const inPath = path.join(tmpDir, `in_${i}`);
              fs.writeFileSync(inPath, Buffer.from(ab));
              const stdPath = path.join(tmpDir, `std_${i}.wav`);
              // Apply EBU R128 loudness normalization (-16 LUFS default), then resample/mono/PCM16
              const loudNorm = `loudnorm=I=${targetLufs}:TP=-1.5:LRA=11:print_format=summary`;
              const conv = spawn(ffbin, ['-y','-i', inPath, '-af', loudNorm, '-ac','1','-ar', String(targetRate), '-sample_fmt','s16','-c:a','pcm_s16le', stdPath], { stdio: ['ignore','pipe','pipe'] });
              let convErr = '';
              conv.stderr.on('data', d => { convErr += d.toString(); });
              const convOk: boolean = await new Promise((r) => conv.on('close', code => r(code === 0)));
              if (!convOk || !fs.existsSync(stdPath)) {
                console.error('ffmpeg convert failed:', convErr);
                try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
                resolve(null);
                return;
              }
              stdPaths.push(stdPath);
            }
            // build concat list from standardized files
            const listPath = path.join(tmpDir, 'concat.txt');
            const listContent = stdPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
            fs.writeFileSync(listPath, listContent);
            const outPath = path.join(tmpDir, 'out.wav');
            // Files are already normalized and standardized; no extra volume boost
            const args = ['-f','concat','-safe','0','-i', listPath, '-c:a','pcm_s16le','-y', outPath];
            const ff = spawn(ffbin, args, { stdio: ['ignore','pipe','pipe'] });
            let stderr = '';
            ff.stderr.on('data', (d) => { stderr += d.toString(); });
            ff.on('close', (c) => {
              try {
                if (c === 0 && fs.existsSync(outPath)) {
                  const buf = fs.readFileSync(outPath);
                  // cleanup temp
                  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
                  resolve(new Uint8Array(buf));
                } else {
                  // cleanup and fallback
                  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
                  console.error('ffmpeg concat failed:', stderr);
                  resolve(null);
                }
              } catch {
                try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
                resolve(null);
              }
            });
            ff.on('error', () => {
              try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
              resolve(null);
            });
          } catch {
            resolve(null);
          }
        });
      });
    }

    const ffmpegResult = await tryFfmpegConcat();
    if (ffmpegResult) {
      let extraHeaders: Record<string, string> = {};
      if (saveFlag) {
        const outputDir = path.join(process.cwd(), 'output');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        const absPath = path.join(outputDir, outName);
        fs.writeFileSync(absPath, ffmpegResult);
        extraHeaders['X-Saved-Path'] = absPath;
      }
      // best-effort delete requested small files (if they exist)
      for (const p of deletePaths) {
        try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
      }
      return new NextResponse(ffmpegResult, {
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Disposition': `attachment; filename="${outName}"`,
          ...extraHeaders,
        },
      });
    }

    // If ffmpeg is not available, the fallback only supports WAV PCM16 with same sampleRate.
    // If inputs are non-WAV (e.g., mp3), return explicit error to install/provide ffmpeg.
    // Validate containers by naive header check for 'RIFF'/'WAVE'
    for (const f of files) {
      const ab = await f.arrayBuffer();
      const dv = new DataView(ab);
      const isRiff = dv.byteLength >= 12 && dv.getUint32(0, false) === 0x52494646 && dv.getUint32(8, false) === 0x57415645;
      if (!isRiff) {
        return NextResponse.json({ error: 'Cần cài ffmpeg (hoặc đặt FFMPEG_PATH) để gộp định dạng không phải WAV PCM16.' }, { status: 500 });
      }
    }

    // Parse WAVs and ensure compatible for fallback path (no resample here)
    type ParsedWav = ReturnType<typeof parseWav>;
    const parsed: ParsedWav[] = [];
    let ref: { sampleRate: number; bitsPerSample: number } | null = null;
    for (const f of files) {
      const ab = await f.arrayBuffer();
      const p = parseWav(ab);
      // Support only PCM16 or Float32 for fallback
      const isPcm16 = p.fmt.audioFormat === 1 && p.fmt.bitsPerSample === 16;
      const isF32 = p.fmt.audioFormat === 3 && p.fmt.bitsPerSample === 32;
      if (!isPcm16 && !isF32) {
        return NextResponse.json({ error: 'Định dạng WAV không hỗ trợ ở chế độ fallback. Cần cài ffmpeg.' }, { status: 500 });
      }
      if (!ref) {
        ref = { sampleRate: p.fmt.sampleRate, bitsPerSample: 16 }; // đầu ra là 16-bit
      } else if (p.fmt.sampleRate !== ref.sampleRate) {
        return NextResponse.json({ error: 'Sample rate khác nhau. Cần ffmpeg để chuẩn hoá.' }, { status: 500 });
      }
      parsed.push(p);
    }

    // Downmix to mono (1 channel) if needed. Sample rate is kept; bits output = 16 (fallback path).
    const targetNumChannels = 1;
    const bytesPerSample = 2; // 16-bit
    // Compute total data length after downmix
    let totalLen = 0;
    for (const p of parsed) {
      const sourceBytesPerSample = (p.fmt.bitsPerSample / 8);
      const frames = Math.floor(p.dataLength / (sourceBytesPerSample * Math.max(1, p.fmt.numChannels)));
      totalLen += frames * bytesPerSample * targetNumChannels;
    }

    const header = buildWavHeader(totalLen, { numChannels: targetNumChannels, sampleRate: (ref as { sampleRate: number }).sampleRate, bitsPerSample: 16 });
    const out = new Uint8Array(header.byteLength + totalLen);
    out.set(new Uint8Array(header), 0);

    let cursor = header.byteLength;
    for (const p of parsed) {
      const numChannels = Math.max(1, p.fmt.numChannels);
      const sourceBytesPerSample = (p.fmt.bitsPerSample / 8);
      const frames = Math.floor(p.dataLength / (sourceBytesPerSample * numChannels));
      const dstView = new DataView(out.buffer, cursor, frames * bytesPerSample * targetNumChannels);

      if (p.fmt.audioFormat === 1 && p.fmt.bitsPerSample === 16) {
        const srcView = new DataView(p.buffer, p.dataOffset, frames * sourceBytesPerSample * numChannels);
        for (let frame = 0; frame < frames; frame++) {
          let acc = 0;
          for (let ch = 0; ch < numChannels; ch++) {
            const s = srcView.getInt16((frame * numChannels + ch) * sourceBytesPerSample, true);
            acc += s;
          }
          // average channels then apply ~+3dB gain (x1.414) with clamp
          let mono = Math.round((acc / numChannels) * 1.414);
          mono = Math.max(-32768, Math.min(32767, mono));
          dstView.setInt16(frame * bytesPerSample, mono, true);
        }
      } else if (p.fmt.audioFormat === 3 && p.fmt.bitsPerSample === 32) {
        const srcView = new DataView(p.buffer, p.dataOffset, frames * sourceBytesPerSample * numChannels);
        for (let frame = 0; frame < frames; frame++) {
          let acc = 0;
          for (let ch = 0; ch < numChannels; ch++) {
            const s = srcView.getFloat32((frame * numChannels + ch) * sourceBytesPerSample, true); // little-endian
            // convert float -1..1 to int16 range
            const s16 = Math.max(-1, Math.min(1, s)) * 32767;
            acc += s16;
          }
          let mono = Math.round((acc / numChannels) * 1.414);
          mono = Math.max(-32768, Math.min(32767, mono));
          dstView.setInt16(frame * bytesPerSample, mono, true);
        }
      }

      cursor += frames * bytesPerSample * targetNumChannels;
    }

    let extraHeaders: Record<string, string> = {};
    if (saveFlag) {
      const outputDir = path.join(process.cwd(), 'output');
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      const absPath = path.join(outputDir, outName);
      fs.writeFileSync(absPath, out);
      extraHeaders['X-Saved-Path'] = absPath;
    }
    // best-effort delete requested small files (if they exist)
    for (const p of deletePaths) {
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
    }

    return new NextResponse(out, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': `attachment; filename="${outName}"`,
        ...extraHeaders,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}


