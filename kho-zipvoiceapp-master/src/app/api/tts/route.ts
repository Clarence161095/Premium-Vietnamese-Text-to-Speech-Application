import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const isNormalized = (formData.get('normalized') as string | null) === 'true';
    const promptWav = formData.get('promptWav') as File | null;
    const promptText = formData.get('promptText') as string | null;
    const voiceName = (formData.get('voiceName') as string | null)?.trim();
    let text = formData.get('text') as string;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    const modelDir = formData.get('modelDir') as string || '/app/src/zipvoice/exp';
    let checkpointName = formData.get('checkpointName') as string || '';
    
    // Auto-detect checkpoint if not provided
    if (!checkpointName) {
      try {
        const modelFiles = fs.readdirSync(modelDir).filter(f => f.endsWith('.pt'));
        if (modelFiles.length > 0) {
          // Sort by iteration number (highest first)
          const sortedFiles = modelFiles.sort((a, b) => {
            const iterA = parseInt(a.match(/iter-(\d+)/)?.[1] || '0');
            const iterB = parseInt(b.match(/iter-(\d+)/)?.[1] || '0');
            return iterB - iterA;
          });
          checkpointName = sortedFiles[0];
          console.log('Auto-detected checkpoint:', checkpointName);
        } else {
          checkpointName = 'iter-525000-avg-2.pt'; // fallback
        }
      } catch (e) {
        checkpointName = 'iter-525000-avg-2.pt'; // fallback
      }
    }
    const tokenizer = formData.get('tokenizer') as string || 'espeak';
    const lang = formData.get('lang') as string || 'vi';

    let promptWavPath: string | null = null;
    let promptTextFinal: string | null = promptText || null;

    // Nếu có voiceName thì lấy từ kho lưu giọng
    if (voiceName) {
      const voicesMetaPath = path.join(process.cwd(), 'voices', 'voices.json');
      console.log('Looking for voices at:', voicesMetaPath);
      console.log('Voices file exists:', fs.existsSync(voicesMetaPath));
      if (fs.existsSync(voicesMetaPath)) {
        const meta = JSON.parse(fs.readFileSync(voicesMetaPath, 'utf-8')) as { voices: { name: string; promptText: string; promptWav: string }[] };
        console.log('Available voices:', meta.voices.map(v => v.name));
        const found = meta.voices.find((v) => v.name.toLowerCase() === voiceName.toLowerCase());
        console.log('Found voice:', found ? found.name : 'none');
        if (found) {
          promptWavPath = found.promptWav;
          if (!promptTextFinal) promptTextFinal = found.promptText;
          console.log('Set promptWavPath:', promptWavPath);
          console.log('Set promptTextFinal:', promptTextFinal);
        }
      }
    }

    if (!promptWavPath && promptWav) {
      // Lưu file prompt wav tạm
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      promptWavPath = path.join(uploadsDir, `prompt_${Date.now()}.wav`);
      const promptWavBuffer = await promptWav.arrayBuffer();
      await writeFile(promptWavPath, Buffer.from(promptWavBuffer));
    }

    console.log('Before validation:', {
      promptWavPath,
      promptTextFinal,
      text: text?.substring(0, 20)
    });
    
    if (!promptWavPath || !promptTextFinal || !text) {
      console.log('Validation failed:', {
        promptWavPath: !!promptWavPath,
        promptTextFinal: !!promptTextFinal, 
        text: !!text
      });
      return NextResponse.json(
        { error: 'Thiếu thông tin: prompt/voiceName, promptText hoặc text' },
        { status: 400 }
      );
    }

    // Minimal server-side normalization safety (in case client skipped)
    if (!isNormalized) {
      // Remove Unicode control/format characters except common whitespace \t, \n, \r
      text = text.replace(/[\p{Cc}\p{Cf}]/gu, (m) => (m === '\t' || m === '\n' || m === '\r' ? m : ''));
      // Normalize smart quotes to ASCII
      const smartToAscii: Record<string, string> = {
        '\u201C': '"', '\u201D': '"', '\u201E': '"', '\u201F': '"',
        '\u2018': "'", '\u2019': "'", '\u201A': "'", '\u2032': "'", '\u2035': "'",
      };
      text = text.replace(/[\u201C\u201D\u201E\u201F\u2018\u2019\u201A\u2032\u2035]/g, (m) => smartToAscii[m] || m);
      // Remove decorative separators (>=5 repeated of same char like *, -, _, .)
      text = text.replace(/([*\-_.~–—=])\1{4,}/g, '');
      // Strip UTF-8 BOM if present
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      text = text.trim();
    }

    // Tạo thư mục output nếu chưa có
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }


    // Tạo tên file output
    const outputFileName = `result_${Date.now()}.wav`;
    const outputPath = path.join(outputDir, outputFileName);

    // Tạo đường dẫn Python - sử dụng biến môi trường hoặc mặc định trong container
    const pythonPath = process.env.PYTHON_PATH || '/usr/local/bin/python3';

    // Chuẩn bị lệnh
    const args = [
      '-m', 'zipvoice.bin.infer_zipvoice',
      '--model-dir', modelDir,
      '--checkpoint-name', checkpointName,
      '--tokenizer', tokenizer,
      '--lang', lang,
      '--prompt-wav', promptWavPath,
      '--prompt-text', promptTextFinal,
      '--text', text,
      '--res-wav-path', outputPath
    ];

    console.log('Chạy lệnh:', pythonPath, args.join(' '));

    // Thực thi lệnh ZipVoice với timeout 10 phút cho CPU processing
    const result = await new Promise<{ success: boolean; error?: string; outputPath?: string }>((resolve) => {
      const pythonProcess = spawn(pythonPath, args, {
        cwd: path.join(process.cwd(), 'src', 'zipvoice'),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONPATH: process.env.PYTHONPATH || '/app/src/zipvoice' }
      });

      // Timeout 10 phút cho CPU processing
      const timeout = setTimeout(() => {
        pythonProcess.kill();
        resolve({ success: false, error: 'Timeout: TTS generation took too long (CPU mode)' });
      }, 600000); // 10 minutes

      let stderr = '';

      pythonProcess.stdout?.on('data', (data) => {
        console.log('STDOUT:', data.toString());
      });

      pythonProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
        console.error('STDERR:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        console.log(`Process exited with code ${code}`);
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve({ success: true, outputPath });
        } else {
          resolve({ 
            success: false, 
            error: `Process failed with code ${code}. Stderr: ${stderr}` 
          });
        }
      });

      pythonProcess.on('error', (error) => {
        clearTimeout(timeout);
        console.error('Process error:', error);
        resolve({ success: false, error: error.message });
      });
    });

    // Xóa file prompt tạm thời
    // Xóa file prompt tạm thời nếu là file tạm (nằm trong uploads)
    if (promptWavPath && promptWavPath.includes(path.join(process.cwd(), 'uploads'))) {
      try {
        await unlink(promptWavPath);
      } catch (error) {
        console.warn('Không thể xóa file prompt:', error);
      }
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Có lỗi xảy ra khi tạo giọng nói' },
        { status: 500 }
      );
    }

    // Đọc file audio đã tạo
    const audioBuffer = fs.readFileSync(result.outputPath!);
    
    // Xóa file output tạm thời
    try {
      await unlink(result.outputPath!);
    } catch (error) {
      console.warn('Không thể xóa file output:', error);
    }

    // Trả về file audio
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': `attachment; filename="${outputFileName}"`,
      },
    });

  } catch (error) {
    console.error('Lỗi API:', error);
    return NextResponse.json(
      { error: 'Lỗi server: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
