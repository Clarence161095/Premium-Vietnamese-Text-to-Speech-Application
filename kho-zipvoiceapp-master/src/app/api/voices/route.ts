import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);

type VoiceMeta = {
  name: string;
  promptText: string;
  promptWav: string; // absolute path
  createdAt: string;
};

const VOICES_DIR = path.join(process.cwd(), 'voices');
const META_FILE = path.join(VOICES_DIR, 'voices.json');

function ensureDirs() {
  if (!fs.existsSync(VOICES_DIR)) fs.mkdirSync(VOICES_DIR, { recursive: true });
  if (!fs.existsSync(META_FILE)) fs.writeFileSync(META_FILE, JSON.stringify({ voices: [] }, null, 2));
}

export async function GET() {
  try {
    ensureDirs();
    const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf-8')) as { voices: VoiceMeta[] };
    return NextResponse.json(meta);
  } catch (e) {
    return NextResponse.json({ voices: [], error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureDirs();
    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    const promptText = (formData.get('promptText') as string) || '';
    const promptWav = formData.get('promptWav') as File | null;

    if (!name || !promptWav) {
      return NextResponse.json({ error: 'Thiếu name hoặc promptWav' }, { status: 400 });
    }

    const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf-8')) as { voices: VoiceMeta[] };
    if (meta.voices.find((v) => v.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json({ error: 'Tên giọng đã tồn tại' }, { status: 400 });
    }

    const fileName = `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.wav`;
    const destPath = path.join(VOICES_DIR, fileName);
    const buf = Buffer.from(await promptWav.arrayBuffer());
    await writeFile(destPath, buf);

    const voice: VoiceMeta = {
      name,
      promptText,
      promptWav: destPath,
      createdAt: new Date().toISOString(),
    };
    meta.voices.push(voice);
    fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));

    return NextResponse.json({ ok: true, voice });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}


