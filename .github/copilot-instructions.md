# Copilot Instructions for Vietnamese TTS Application (ZipVoice)

## Project Overview
This is a **production-ready Dockerized Vietnamese Text-to-Speech application** built on ZipVoice (zero-shot flow matching TTS). The project combines ZipVoice's core TTS capabilities with a fully localized Vietnamese web interface and optimized performance.

### Architecture Components
- **ZipVoice Core**: Flow matching TTS models in `/ZipVoice` (submodule from k2-fsa/ZipVoice)
- **Backend**: FastAPI service (`/backend/main.py`) with GPU acceleration and dual-path Vietnamese optimization
- **Frontend**: React + Vite SPA (`/frontend/src/App.jsx`) with Vietnamese UI and quality presets
- **Data Layer**: File-based storage (`/data`) with JSON metadata for voice profiles

## Vietnamese Language Integration (Critical)
The application uses **eSpeak tokenizer with vi language** for Vietnamese pronunciation accuracy:
```bash
python3 -m zipvoice.bin.infer_zipvoice --tokenizer espeak --lang vi
```
- **Why eSpeak**: Handles Vietnamese tones, diacritics, and phoneme mapping correctly
- **Alternative tokenizers** (`emilia`, `libritts`, `simple`) don't support Vietnamese properly
- **Language code**: Always use `vi` for Vietnamese text processing
- **Audio format**: 24kHz mono conversion via FFmpeg (critical for Vietnamese compatibility)

## Performance Optimization Architecture
### Dual-Path Processing (New)
```python
# Smart path selection based on text characteristics
is_single_sentence = len(sentences) == 1 and len(text.split()) <= 20

if is_single_sentence:
    # Fast path: ~8-10 seconds for short sentences
    final_audio_path = fast_vietnamese_inference(prompt_wav, prompt_text, text, out_dir)
else:
    # Batch path: TSV processing for long/multi-sentence text
    tsv_path = build_vietnamese_tsv(out_dir, prompt_text, prompt_wav, sentences)
    vietnamese_inference(out_dir, tsv_path, gpu_offload)
    final_audio_path = merge_vietnamese_segments(out_dir)
```

### Vietnamese Defaults (Production-Optimized)
```python
VIETNAMESE_DEFAULTS = {
    "guidance_scale": 1.0,      # ZipVoice default for quality
    "num_step": 16,             # Balanced quality/speed
    "context_length": 10000,    # 10k tokens (VRAM management)
    "gpu_offload": 0.9          # 90% GPU utilization
}
```

## Default Profile Pattern (New)
### No-Profile-Required Design
```python
# Backend automatically uses DEFAULT_PROFILE = "tina" when no profile specified
if not profile_id:
    profile_id = DEFAULT_PROFILE
    print(f"[INFO] Using default Vietnamese profile: {profile_id}")
```

### Frontend Default Voice UI
```javascript
// Prominent default voice option in Vietnamese
<button onClick={() => setSelectedProfile('')}>
  {!selectedProfile ? '✓ Đang sử dụng giọng mặc định' : 'Sử dụng giọng mặc định'}
</button>
```

## Docker Development Workflow
### Container Architecture
```yaml
# GPU-enabled backend with ZipVoice mount
backend: nvidia/cuda:12.1.0 + FastAPI + PyTorch CUDA
frontend: Node.js + Vite development server
```

### Critical Path Mappings
```bash
./ZipVoice:/ZipVoice          # ZipVoice source (read-only)
./backend:/app               # Live code editing
./data:/data                 # Voice profiles & audio files
PYTHONPATH=/ZipVoice:/app     # Import resolution
```

### Development Commands
```bash
docker compose up -d          # Start services
docker compose logs -f        # Monitor both services
docker compose restart backend # Apply backend changes
```

## Frontend Patterns (React + Vite)
### Vietnamese-First UI Design
```javascript
// Built-in Vietnamese examples for immediate use
const vietnameseExamples = [
  "Xin chào, tôi là trợ lý ảo của bạn.",
  "Hôm nay trời đẹp quá, chúng ta đi dạo nhé!",
  // ...
];

// Quality presets optimized for Vietnamese
const presets = {
  highQuality: { guidanceScale: 1.2, numSteps: 24, /* ... */ },
  balanced: { guidanceScale: 1.0, numSteps: 16, /* ... */ },
  fast: { guidanceScale: 0.8, numSteps: 12, /* ... */ }
};
```

### State Management Pattern
```javascript
// No auto-selection of profiles - promotes default voice usage
const loadProfiles = async () => {
  const data = await fetch('http://localhost:8000/profiles').then(r => r.json());
  setProfiles(data);
  // Don't auto-select profile - let user choose or use default
};
```

## Critical Path Issues (Lessons Learned)
### Linux Path Handling
- **Problem**: `os.path.join()` creates Windows paths, causing ZipVoice failures
- **Solution**: Use f-strings for Linux paths: `f"/data/{profile_id}/sample.wav"`
- **Git Bash**: Converts `/data` to `C:/Program Files/Git/data` - use `docker exec` for testing

### ZipVoice Parameter Mapping
- **Correct**: `--res-dir` (not `--output-path`) for ZipVoice CLI
- **Fast inference**: Direct `--prompt-wav`, `--prompt-text`, `--text` parameters
- **Batch inference**: Use `--test-list` with TSV file format

### Vietnamese Sentence Splitting
```python
# Vietnamese-aware sentence boundaries
def split_vietnamese_sentences(text: str) -> List[str]:
    parts = [p.strip() for p in re.split(r'(?<=[\.\!\?…])\s+', text) if p.strip()]
    return parts if parts else [text]
```

## Testing & Debugging
### Manual API Testing
```bash
# Test default profile (no profile_id required)
curl -X POST "http://localhost:8000/synthesize_speech" \
  -F "text=Xin chào Việt Nam" \
  --output test.wav

# Test custom profile
curl -X POST "http://localhost:8000/synthesize_speech" \
  -F "profile_id=tina" \
  -F "text=Xin chào Việt Nam" \
  --output test.wav
```

### Performance Monitoring
```bash
# Check processing path selection in logs
docker compose logs backend | grep -E "\[FAST\]|\[BATCH\]"

# Monitor GPU usage during generation
watch -n 1 nvidia-smi
```

## Dependencies & Requirements
### Critical for Vietnamese Support
- **eSpeak**: Phoneme tokenization with Vietnamese language support
- **FFmpeg**: 24kHz mono conversion (`-ac 1 -ar 24000`)
- **soundfile + numpy**: Audio segment merging for batch processing

### Performance Stack
- **CUDA 12.1+**: GPU acceleration
- **PyTorch CUDA**: Model inference
- **FastAPI**: Async request handling with file uploads
