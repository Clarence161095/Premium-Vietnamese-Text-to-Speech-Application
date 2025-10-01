import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dirParam = searchParams.get('modelDir');

    const modelDir = dirParam && dirParam.trim().length > 0
      ? dirParam
      : '/app/src/zipvoice/exp';

    if (!fs.existsSync(modelDir)) {
      return NextResponse.json({ checkpoints: [], error: 'Model directory không tồn tại' }, { status: 400 });
    }

    const entries = fs.readdirSync(modelDir, { withFileTypes: true });
    const checkpoints = entries
      .filter((e) => e.isFile() && (e.name.endsWith('.pt') || e.name.endsWith('.safetensors')))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ checkpoints });
  } catch (error) {
    return NextResponse.json({ checkpoints: [], error: (error as Error).message }, { status: 500 });
  }
}


