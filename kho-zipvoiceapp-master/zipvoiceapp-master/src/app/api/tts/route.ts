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
    // Optional: allow passing a pre-normalized flag to skip internal normalization when handled on client
    const isNormalized = (formData.get('normalized') as string | null) === 'true';
    const promptWav = formData.get('promptWav') as File | null;
    const promptText = formData.get('promptText') as string | null;
    const voiceName = (formData.get('voiceName') as string | null)?.trim();
    let text = formData.get('text') as string;
    const modelDir = formData.get('modelDir') as string || 'D:/zipvoiceapp/src/zipvoice/exp';
    const checkpointName = formData.get('checkpointName') as string || 'iter-96000-avg-2.pt';
    const tokenizer = formData.get('tokenizer') as string || 'espeak';
    const lang = formData.get('lang') as string || 'vi';

    let promptWavPath: string | null = null;
    let promptTextFinal: string | null = promptText || null;

    // Nếu có voiceName thì lấy từ kho lưu giọng
    if (voiceName) {
      const voicesMetaPath = path.join(process.cwd(), 'voices', 'voices.json');
      if (fs.existsSync(voicesMetaPath)) {
        const meta = JSON.parse(fs.readFileSync(voicesMetaPath, 'utf-8')) as { voices: { name: string; promptText: string; promptWav: string }[] };
        const found = meta.voices.find((v) => v.name.toLowerCase() === voiceName.toLowerCase());
        if (found) {
          promptWavPath = found.promptWav;
          if (!promptTextFinal) promptTextFinal = found.promptText;
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

    if (!promptWavPath || !promptTextFinal || !text) {
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

    // Tạo đường dẫn Python
    const pythonPath = 'C:\\Users\\Del25\\.conda\\envs\\zipvoice\\python.exe';
    const scriptPath = path.join(process.cwd(), 'src', 'zipvoice', 'zipvoice', 'bin', 'infer_zipvoice.py');

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

    // Thực thi lệnh ZipVoice
    const result = await new Promise<{ success: boolean; error?: string; outputPath?: string }>((resolve) => {
      const pythonProcess = spawn(pythonPath, args, {
        cwd: path.join(process.cwd(), 'src', 'zipvoice'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
        console.log('STDOUT:', data.toString());
      });

      pythonProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
        console.error('STDERR:', data.toString());
      });

      pythonProcess.on('close', (code) => {
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
