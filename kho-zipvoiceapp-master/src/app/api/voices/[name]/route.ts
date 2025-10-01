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

function ensureMeta(): { voices: VoiceMeta[] } {
  if (!fs.existsSync(VOICES_DIR)) fs.mkdirSync(VOICES_DIR, { recursive: true });
  if (!fs.existsSync(META_FILE)) fs.writeFileSync(META_FILE, JSON.stringify({ voices: [] }, null, 2));
  return JSON.parse(fs.readFileSync(META_FILE, 'utf-8')) as { voices: VoiceMeta[] };
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name: paramName } = await params;
    const name = decodeURIComponent(paramName || '').trim();
    if (!name) return NextResponse.json({ error: 'Thiếu tên giọng' }, { status: 400 });

    const meta = ensureMeta();
    const idx = meta.voices.findIndex((v) => v.name.toLowerCase() === name.toLowerCase());
    if (idx < 0) return NextResponse.json({ error: 'Không tìm thấy giọng' }, { status: 404 });

    const formData = await request.formData();
    const newPromptText = (formData.get('promptText') as string) ?? undefined;
    const newPromptWav = formData.get('promptWav') as File | null;
    const newName = (formData.get('newName') as string | null)?.trim();

    if (typeof newPromptText === 'string') {
      meta.voices[idx].promptText = newPromptText;
    }

    if (newPromptWav) {
      const fileName = `${meta.voices[idx].name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.wav`;
      const destPath = path.join(VOICES_DIR, fileName);
      const buf = Buffer.from(await newPromptWav.arrayBuffer());
      await writeFile(destPath, buf);
      meta.voices[idx].promptWav = destPath;
    }

    if (newName && newName.length > 0 && newName.toLowerCase() !== meta.voices[idx].name.toLowerCase()) {
      if (meta.voices.find((v, i) => i !== idx && v.name.toLowerCase() === newName.toLowerCase())) {
        return NextResponse.json({ error: 'Tên giọng đã tồn tại' }, { status: 400 });
      }
      meta.voices[idx].name = newName;
    }

    fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
    return NextResponse.json({ ok: true, voice: meta.voices[idx] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name: paramName } = await params;
    const name = decodeURIComponent(paramName || '').trim();
    if (!name) return NextResponse.json({ error: 'Thiếu tên giọng' }, { status: 400 });
    const meta = ensureMeta();
    const idx = meta.voices.findIndex((v) => v.name.toLowerCase() === name.toLowerCase());
    if (idx < 0) return NextResponse.json({ error: 'Không tìm thấy giọng' }, { status: 404 });
    const removed = meta.voices.splice(idx, 1)[0];
    fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
    return NextResponse.json({ ok: true, removed: { name: removed.name } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}


