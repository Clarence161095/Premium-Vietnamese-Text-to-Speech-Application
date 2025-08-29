# index.py
from pathlib import Path
import re, sys, subprocess, shutil, datetime
import soundfile as sf
import numpy as np

# ====== TUẤN CHỈ SỬA 4 ĐƯỜNG DẪN NÀY ======
# SAMPLE_WAV = Path("data/sample-vi.wav")   # giọng mẫu (mp3/wav đều được)
# SAMPLE_TXT = Path("data/sample-vi.txt")   # transcript của giọng mẫu (khớp 100%)
# INPUT_TXT  = Path("data/input.txt")       # văn bản tiếng Việt cần đọc
# FINAL_WAV  = Path("out/final.wav")        # tên file cuối (sẽ đặt trong folder timestamp)
# =========================================

# ====== Mẫu giọng Tina ======
SAMPLE_WAV = Path("data/tina/sample-tina.wav")   # giọng mẫu (mp3/wav đều được)
SAMPLE_TXT = Path("data/tina/sample-tina.txt")   # transcript của giọng mẫu (khớp 100%)
INPUT_TXT  = Path("data/tina/input.txt")       # văn bản tiếng Việt cần đọc
FINAL_WAV  = Path("out/tina/final.wav")        # tên file cuối (sẽ đặt trong folder timestamp)
# ====== Mẫu giọng Tina ======

# Model đã tải sẵn:
MODEL_DIR = Path("models/zipvoice_vi")         # chứa iter-525000-avg-2.pt, tokens.txt, config.json
CHECKPOINT_NAME = "iter-525000-avg-2.pt"

# BẮT BUỘC dùng espeak + lang=vi cho tiếng Việt
TOKENIZER = "espeak"
LANG = "vi"

def fail(msg):
    print(f"[ERR] {msg}")
    sys.exit(1)

def run(cmd):
    print("[RUN]", " ".join([str(c) for c in cmd]))
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    print(res.stdout)
    if res.returncode != 0:
        fail(f"Lệnh lỗi: {' '.join([str(c) for c in cmd])}")
    return res.stdout

def ensure_env():
    # Kiểm tra input
    for p in [SAMPLE_WAV, SAMPLE_TXT, INPUT_TXT]:
        if not Path(p).exists():
            fail(f"Thiếu file: {p}")
    # Kiểm tra model
    if not MODEL_DIR.exists():
        fail(f"Thiếu thư mục model: {MODEL_DIR}")
    if not (MODEL_DIR / CHECKPOINT_NAME).exists():
        fail(f"Thiếu checkpoint: {MODEL_DIR / CHECKPOINT_NAME}")
    if not (MODEL_DIR / "tokens.txt").exists():
        fail(f"Thiếu tokens.txt trong {MODEL_DIR}")
    # model.json -> config.json (một số bản CLI yêu cầu model.json)
    if not (MODEL_DIR / "model.json").exists() and (MODEL_DIR / "config.json").exists():
        try:
            (MODEL_DIR / "model.json").symlink_to("config.json")
            print("[OK] Tạo symlink model.json -> config.json")
        except Exception:
            shutil.copy(MODEL_DIR / "config.json", MODEL_DIR / "model.json")
            print("[OK] Copy model.json từ config.json")
    # espeak-ng
    if shutil.which("espeak-ng") is None:
        print("[WARN] Không tìm thấy espeak-ng trong PATH. Cài bằng: brew install espeak-ng")

def mk_out_dir():
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")  # theo yêu cầu
    out_dir = Path("out") / ts
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir

def ensure_prompt_wav(sample_path: Path, out_dir: Path):
    prompt_wav = out_dir / "prompt-24k.wav"
    cmd = ["ffmpeg", "-y", "-i", str(sample_path), "-ac", "1", "-ar", "24000", str(prompt_wav)]
    run(cmd)
    return prompt_wav.resolve()

def read_clean(path: Path):
    txt = path.read_text(encoding="utf-8").strip()
    # Gom khoảng trắng, giữ nguyên dấu câu
    txt = re.sub(r"\s+", " ", txt)
    return txt

def split_sentences(paragraph: str):
    # Tách câu theo . ! ? … ; giữ câu ngắn giúp prosody tốt hơn
    parts = [p.strip() for p in re.split(r'(?<=[\.\!\?…])\s+', paragraph) if p.strip()]
    return parts

def build_test_tsv(out_dir: Path, prompt_text: str, prompt_wav_abs: str, sentences):
    tsv = out_dir / "tmp_test.tsv"
    with open(tsv, "w", encoding="utf-8", newline="\n") as f:
        for i, sent in enumerate(sentences, 1):
            name = f"seg_{i:03d}"
            f.write("\t".join([name, prompt_text, prompt_wav_abs, sent]) + "\n")
    # sanity check
    bad = []
    for ln, line in enumerate(tsv.read_text(encoding="utf-8").splitlines(), 1):
        if len(line.split("\t")) != 4:
            bad.append((ln, line))
    if bad:
        for ln, line in bad[:5]:
            print(f"[BAD] Dòng {ln} không đủ 4 cột: {line}")
        fail("tmp_test.tsv lỗi định dạng (phải 4 cột, TAB).")
    return tsv

def infer(out_dir: Path, test_tsv: Path):
    cmd = [
        sys.executable, "-m", "zipvoice.bin.infer_zipvoice",
        "--model-name", "zipvoice",
        "--model-dir", str(MODEL_DIR),
        "--checkpoint-name", CHECKPOINT_NAME,
        "--tokenizer", TOKENIZER,
        "--lang", LANG,
        "--test-list", str(test_tsv),
        "--res-dir", str(out_dir),
        # Tuỳ chọn tinh chỉnh nhẹ nếu cần:
        # "--num-step", "16", "--guidance-scale", "1.0"
    ]
    run(cmd)

def merge_segments(out_dir: Path, final_basename: str):
    wavs = sorted(out_dir.glob("seg_*.wav"))
    if not wavs:
        fail("Không thấy seg_*.wav sau khi suy luận. Kiểm tra log ở trên.")
    sr = None
    chunks = []
    for p in wavs:
        x, r = sf.read(p)
        if sr is None: sr = r
        if r != sr: fail(f"Sample rate không khớp ở {p}")
        if x.ndim == 2: x = x[:,0]
        chunks.append(x)
    y = np.concatenate(chunks)
    final_path = out_dir / Path(final_basename).name  # đặt vào thư mục timestamp
    sf.write(final_path, y, sr)
    print(f"[OK] Đã tạo {final_path} ({len(wavs)} đoạn)")

def main():
    print("=== ZipVoice VI (tokenizer=espeak, lang=vi) ===")
    ensure_env()

    out_dir = mk_out_dir()
    print(f"[INFO] Thư mục kết quả: {out_dir}")

    # 1) Chuẩn hoá sample → 24kHz mono
    prompt_wav_abs = str(ensure_prompt_wav(SAMPLE_WAV, out_dir))

    # 2) Đọc prompt text & input text
    prompt_text = read_clean(SAMPLE_TXT)
    input_text  = read_clean(INPUT_TXT)

    # 3) Tách câu ngắn
    sents = split_sentences(input_text)
    if not sents:
        fail("input.txt rỗng hoặc không tách được câu.")
    print(f"[INFO] Số câu cần đọc: {len(sents)}")

    # 4) Tạo tmp_test.tsv trong thư mục timestamp
    tsv = build_test_tsv(out_dir, prompt_text, prompt_wav_abs, sents)
    print(f"[OK] Tạo {tsv}")

    # 5) Suy luận
    infer(out_dir, tsv)

    # 6) Ghép file
    merge_segments(out_dir, FINAL_WAV.name)

    print("[DONE] Hoàn tất. Nghe thử file final trong thư mục timestamp ở /out.")

if __name__ == "__main__":
    main()
