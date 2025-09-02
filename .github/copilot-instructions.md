# Copilot Instructions for Vietnamese TTS Application (ZipVoice)

## Project Overview
This is a **production-ready Dockerized Vietnamese Text-to-Speech application v2.0** built on ZipVoice (zero-shot flow matching TTS). The architecture prioritizes simplicity, safety, and reliability over complex parameter tuning.

### Core Architecture (v2.0)
- **ZipVoice Core**: `/ZipVoice` submodule with Vietnamese model in `/models/zipvoice_vi/`
- **Backend**: FastAPI (`/backend/main.py`) with GPU monitoring, thermal protection, sentence-by-sentence processing
- **Frontend**: React + Vite (`/frontend/src/App.jsx`) with simplified UI, real-time monitoring, emergency controls
- **Processing**: Temporary work in `/DOING/timestamp/` with automatic cleanup after 8 hours
- **Storage**: Voice profiles in `/data/` with JSON metadata, render history in `/data/data.json`

## Critical v2.0 Architecture Patterns

### Sentence-First Processing (Core Pattern)
```python
# ALWAYS split text into sentences - never process entire text at once
sentences = split_vietnamese_sentences(text)
doing_dir = f"/DOING/{timestamp}"

for i, sentence in enumerate(sentences):
    segment_path = f"{doing_dir}/seg_{i:03d}.wav"
    # Process each sentence separately (60s timeout each)
    vietnamese_sentence_inference(sentence, segment_path, profile_data)

# Merge segments with 0.5s pauses for natural flow
final_audio = merge_vietnamese_segments(doing_dir)
```

### GPU Safety System (Critical)
```python
# Temperature monitoring prevents hardware damage
gpu_status = get_gpu_status()  # nvidia-smi every 5 seconds
if gpu_status.temperature >= 90:  # EMERGENCY_STOP
    process_controller.stop_current_process()
elif gpu_status.temperature >= 85:  # THROTTLE
    # Reduce processing load
```

### ZipVoice Vietnamese Command (Exact Pattern)
```bash
# CRITICAL: Must include model-dir and checkpoint for Vietnamese support
python3 -m zipvoice.bin.infer_zipvoice \
    --model-name zipvoice \
    --model-dir /models/zipvoice_vi \
    --checkpoint-name iter-525000-avg-2.pt \
    --tokenizer espeak \
    --lang vi \
    --test-list vietnamese_test.tsv \
    --res-dir /DOING/timestamp
```

### API v2.0 Endpoints (Production)
- `POST /synthesize_speech_v2` - Main TTS endpoint (only needs `text` + optional `profile_id`)
- `GET /gpu_status` - Real-time GPU temp/utilization/VRAM (poll every 5s)
- `GET /render_status` - Processing progress (current_sentence/total_sentences)
- `POST /stop_render` - Emergency stop current process
- `GET /performance_metrics` - Historical render stats for time estimation

## Development Workflow

### Quick Start Commands
```bash
# Start development environment
docker compose up -d

# Monitor backend processing in real-time
docker compose logs -f backend | grep -E "\[SENTENCE\]|\[GPU\]|\[MERGE\]"

# Check GPU status during processing
watch -n 1 nvidia-smi

# Test Vietnamese synthesis
curl -X POST "http://localhost:8000/synthesize_speech_v2" \
  -F "text=Xin chào Việt Nam!" --output test.wav
```

### Key File Locations
- **Main API**: `/backend/main.py` - All endpoints, GPU monitoring, sentence processing
- **Frontend**: `/frontend/src/App.jsx` - React UI with real-time monitoring components
- **Reference impl**: `/refer/simple-index.py` - Proven sentence-by-sentence approach
- **Docker config**: `docker-compose.yml` - GPU access, volume mounts, environment

## Critical Implementation Details

### Vietnamese Text Processing
```python
def split_vietnamese_sentences(text: str) -> List[str]:
    # Vietnamese sentence boundaries: [.!?…] + whitespace
    parts = [p.strip() for p in re.split(r'(?<=[.!?…])\s+', text) if p.strip()]
    # Filter sentences <3 chars (prevents conv1d kernel errors)
    return [p for p in parts if len(re.sub(r'[.!?…\s]', '', p)) >= 3]
```

### Linux Path Handling (Critical)
```python
# WRONG: os.path.join() creates Windows paths in containers
profile_path = os.path.join("/data", profile_id, "sample.wav")

# CORRECT: Use f-strings for Linux containers
profile_path = f"/data/{profile_id}/sample.wav"
```

### Emergency Stop Pattern
```python
# ProcessController for safe termination
class ProcessController:
    def stop_current_process(self):
        self.should_stop = True
        if self.current_process:
            self.current_process.terminate()

# Check during processing loops
if process_controller.is_stopped() or should_stop_processing():
    raise Exception("Processing stopped")
```

### TSV Generation (ZipVoice Input Format)
```python
# Create batch file for ZipVoice inference
tsv_content = []
for i, sentence in enumerate(sentences):
    tsv_content.append(f"seg_{i:03d}\t{transcript}\t{prompt_path}\t{sentence}")

with open(f"{doing_dir}/vietnamese_test.tsv", 'w', encoding='utf-8') as f:
    f.write('\n'.join(tsv_content))
```

## Performance & Monitoring Patterns

### Real-Time UI Updates (Frontend)
```javascript
// Poll every 5 seconds for GPU and render status
useEffect(() => {
    const interval = setInterval(async () => {
        const [gpuResponse, renderResponse] = await Promise.all([
            fetch('http://localhost:8000/gpu_status'),
            fetch('http://localhost:8000/render_status')
        ]);
        // Update UI with real-time data
    }, 5000);
    return () => clearInterval(interval);
}, []);
```

### Performance Metrics Storage
```python
# Track last 1000 renders for time estimation
class RenderMetrics:
    def __init__(self):
        self.recent_renders = deque(maxlen=1000)
    
    def estimate_time(self, word_count: int) -> float:
        avg_time_per_word = sum(r['time']/r['words'] for r in self.recent_renders) / len(self.recent_renders)
        return word_count * avg_time_per_word
```

## Container Architecture

### Volume Mappings (Critical)
```yaml
volumes:
  - ./ZipVoice:/ZipVoice:ro          # Read-only ZipVoice source
  - ./backend:/app                   # Live backend code editing
  - ./data:/data                     # Voice profiles (persistent)
  - ./DOING:/DOING                   # Processing temp files
  - ./models:/models:ro              # Vietnamese model (read-only)

environment:
  - PYTHONPATH=/ZipVoice:/app        # Import resolution
  - CUDA_MEMORY_FRACTION=0.9         # GPU memory limit
```

### Default Voice Pattern
```python
# Backend: Automatic fallback to "tina" profile
if not profile_id:
    profile_id = DEFAULT_PROFILE  # "tina"
    print(f"[INFO] Using default Vietnamese profile: {profile_id}")
```

```javascript
// Frontend: Prominent default voice button
<button onClick={() => setSelectedProfile('')}>
  {!selectedProfile ? '✓ Đang sử dụng giọng mặc định' : 'Sử dụng giọng mặc định'}
</button>
```

## Debugging & Testing

### Common Issues
- **Poor audio quality**: Check if using Vietnamese model (`--model-dir /models/zipvoice_vi`)
- **Path errors**: Use f-strings instead of `os.path.join()` in containers
- **GPU overheating**: Monitor nvidia-smi, check thermal protection triggers
- **Empty audio**: Verify sentences pass minimum 3-character filter

### Log Monitoring
```bash
# Backend sentence processing
docker compose logs backend | grep "\[SENTENCE\]"

# GPU temperature alerts
docker compose logs backend | grep "\[GPU\]"

# Audio merging success
docker compose logs backend | grep "\[MERGE\]"
```
