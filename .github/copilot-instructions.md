# Copilot Instructions for Vietnamese TTS Application (ZipVoice)

## Project Overview
This is a **production-ready Dockerized Vietnamese Text-to-Speech application** built on ZipVoice (zero-shot flow matching TTS). The project combines ZipVoice's core TTS capabilities with a fully localized Vietnamese web interface and optimized performance.

### Architecture Components
- **ZipVoice Core**: Flow matching TTS models in `/ZipVoice` (submodule from k2-fsa/ZipVoice)
- **Backend**: FastAPI service (`/backend/main.py`) with GPU acceleration and sentence-based processing
- **Frontend**: React + Vite SPA (`/frontend/src/App.jsx`) with Vietnamese UI and profile management
- **Data Layer**: File-based storage (`/data`) with JSON metadata for voice profiles
- **Models**: Vietnamese-trained ZipVoice model in `/models/zipvoice_vi/`

## Version 2 Refactoring Goals (Current Priority)
Based on user request for version-2 branch refactoring:

### Backend Simplification
- **Remove advanced input controls** - use ZipVoice README.md defaults only
- **Sentence-by-sentence processing** - split long text and render separately in `/DOING` folder
- **GPU monitoring** - track temperature, stop at 90°C, maintain 85% utilization
- **Stop button functionality** - emergency halt for current processes
- **Performance metrics** - store last 1000 renders (word count vs time) for estimation

### Frontend Streamlining
- **Remove quality presets** - too complex, not beneficial per user feedback
- **Focus on profile management** - make voice profile UI clean and professional
- **Real-time stats**: render timer, time estimation, GPU/VRAM status (5s intervals), emergency stop
- **Remove advanced settings** - everything uses defaults now
- **Unlimited tokens** - no max limit since sentence-by-sentence processing handles any length

## Vietnamese Language Integration (Critical)
The application uses **eSpeak tokenizer with vi language** for Vietnamese pronunciation accuracy:
```bash
python3 -m zipvoice.bin.infer_zipvoice --tokenizer espeak --lang vi
```
- **Why eSpeak**: Handles Vietnamese tones, diacritics, and phoneme mapping correctly
- **Alternative tokenizers** (`emilia`, `libritts`, `simple`) don't support Vietnamese properly  
- **Language code**: Always use `vi` for Vietnamese text processing
- **Audio format**: 24kHz mono conversion via FFmpeg (critical for Vietnamese compatibility)

## Sentence-Based Processing Architecture (Version 2)
### New Processing Pattern
```python
# Always split into sentences, never render entire text at once
sentences = split_vietnamese_sentences(text)
doing_dir = "/DOING"  # Use this folder for processing

for i, sentence in enumerate(sentences):
    segment_path = f"{doing_dir}/seg_{i:03d}.wav"
    # Render each sentence individually (optimal: under 1 minute each)
    render_single_sentence(sentence, segment_path)
    
# Then merge all segments
final_audio = merge_segments(doing_dir)
```

### Reference Implementation
See `/refer/simple-index.py` for the proven sentence-by-sentence approach:
- Creates timestamped output directories
- TSV-based batch processing for multiple sentences
- Proper Vietnamese text cleaning and sentence splitting
- Audio segment merging with sample rate validation

## GPU Management & Performance Monitoring
### Temperature & Load Management
```python
# Monitor GPU every few seconds during processing
def check_gpu_status():
    temp = get_gpu_temperature()
    utilization = get_gpu_utilization()
    
    if temp > 90:
        # Emergency cooling - reduce workload
        return "EMERGENCY_STOP"
    elif temp > 85:
        # Reduce processing speed
        return "THROTTLE"
    
    return "NORMAL"
```

### Performance Data Collection
```python
# Store metrics for accurate time estimation
class RenderMetrics:
    def __init__(self):
        self.recent_renders = deque(maxlen=1000)  # Last 1000 renders
    
    def add_render(self, word_count: int, render_time: float):
        self.recent_renders.append({
            'words': word_count,
            'time': render_time,
            'timestamp': datetime.now()
        })
    
    def estimate_time(self, word_count: int) -> float:
        # Calculate based on recent performance data
        avg_time_per_word = sum(r['time']/r['words'] for r in self.recent_renders) / len(self.recent_renders)
        return word_count * avg_time_per_word
```

## Default Profile Pattern (No-Profile-Required Design)
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
./DOING:/DOING               # Temporary processing folder
PYTHONPATH=/ZipVoice:/app     # Import resolution
```

### Development Commands
```bash
docker compose up -d          # Start services
docker compose logs -f backend # Monitor backend processing
docker compose restart backend # Apply backend changes
```

## Critical Implementation Details
### Linux Path Handling
- **Problem**: `os.path.join()` creates Windows paths, causing ZipVoice failures
- **Solution**: Use f-strings for Linux paths: `f"/data/{profile_id}/sample.wav"`
- **Git Bash**: Converts `/data` to `C:/Program Files/Git/data` - use `docker exec` for testing

### ZipVoice CLI Parameters
```bash
# Correct command structure for Vietnamese TTS
python3 -m zipvoice.bin.infer_zipvoice \
    --model-name zipvoice \
    --model-dir /models/zipvoice_vi \
    --checkpoint-name iter-525000-avg-2.pt \
    --tokenizer espeak \
    --lang vi \
    --test-list vietnamese_test.tsv \
    --res-dir /DOING
```

### Vietnamese Text Processing
```python
def split_vietnamese_sentences(text: str) -> List[str]:
    # Vietnamese-aware sentence boundaries
    parts = [p.strip() for p in re.split(r'(?<=[\.\!\?…])\s+', text) if p.strip()]
    return parts if parts else [text]

def clean_vietnamese_text(text: str) -> str:
    # Preserve diacritics and Vietnamese characters
    text = re.sub(r'\s+', ' ', text.strip())
    return text
```

## Testing & Debugging
### Manual API Testing
```bash
# Test default profile with sentence processing
curl -X POST "http://localhost:8000/synthesize_speech" \
  -F "text=Xin chào Việt Nam. Hôm nay trời đẹp quá!" \
  --output test.wav
```

### Performance Monitoring
```bash
# Monitor processing logs
docker compose logs backend | grep -E "\[SENTENCE\]|\[MERGE\]|\[GPU\]"

# Check GPU status during processing
watch -n 1 nvidia-smi
```

## Dependencies & Requirements
### Critical for Vietnamese Support
- **eSpeak**: Phoneme tokenization with Vietnamese language support
- **FFmpeg**: 24kHz mono conversion (`-ac 1 -ar 24000`) 
- **soundfile + numpy**: Audio segment merging for batch processing

### Performance Stack
- **CUDA 12.1+**: GPU acceleration with temperature monitoring
- **PyTorch CUDA**: Model inference with memory management
- **FastAPI**: Async request handling with stop functionality
