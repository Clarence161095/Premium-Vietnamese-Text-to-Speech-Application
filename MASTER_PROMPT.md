# MASTER PROMPT: Premium Vietnamese Text-to-Speech Application

## Application Overview
This is a **Premium Vietnamese Text-to-Speech (TTS)** application that generates high-quality, natural Vietnamese speech from text input using the ZipVoice model with Vietnamese-specific training. The application uses a zero-shot voice cloning approach where users can upload voice samples to create personalized Vietnamese voices.

## Core Architecture

### Backend (FastAPI + ZipVoice)
- **Framework**: FastAPI with CORS support
- **TTS Engine**: ZipVoice with Vietnamese-specific model
- **Model Location**: `/models/zipvoice_vi/` containing:
  - `iter-525000-avg-2.pt` (Vietnamese-trained checkpoint)
  - `tokens.txt` (Vietnamese tokens)
  - `config.json` (model configuration)
- **Tokenizer**: eSpeak with Vietnamese language (`--tokenizer espeak --lang vi`)
- **Audio Processing**: FFmpeg for 24kHz mono conversion, soundfile for segment merging
- **Profile Management**: JSON-based voice profile storage with audio samples

### Frontend (React + Vite)
- **Framework**: React 18 with Vite build system
- **UI Language**: Vietnamese interface with examples and presets
- **Features**: Voice profile management, advanced parameter controls, quality presets
- **Audio Controls**: Playback controls, download functionality

### Infrastructure
- **Containerization**: Docker Compose with GPU support (CUDA 12.1)
- **Networking**: Backend on port 8000, Frontend on port 3000
- **Data Persistence**: `/data` volume for profiles and audio samples

## Critical Implementation Details

### Vietnamese TTS Command Structure (EXACT REQUIREMENTS)
```bash
python3 -m zipvoice.bin.infer_zipvoice \
  --model-name zipvoice \
  --model-dir /models/zipvoice_vi \
  --checkpoint-name iter-525000-avg-2.pt \
  --tokenizer espeak \
  --lang vi \
  --test-list tmp_test.tsv \
  --res-dir output_directory
```

**CRITICAL**: The current backend is missing `--model-dir` and `--checkpoint-name` parameters, which causes it to use the default English model instead of the Vietnamese-trained model, resulting in poor Vietnamese pronunciation.

### TSV Format for Batch Processing
```
seg_001<TAB>prompt_text<TAB>prompt_wav_path<TAB>target_sentence_1
seg_002<TAB>prompt_text<TAB>prompt_wav_path<TAB>target_sentence_2
```

### Audio Processing Pipeline
1. Convert sample audio to 24kHz mono using FFmpeg
2. Split Vietnamese text into sentences for better prosody
3. Generate TSV file with proper UTF-8 encoding (no escaped characters)
4. Run ZipVoice inference with Vietnamese model parameters
5. Merge generated segments using soundfile/numpy

## API Specification

### Core Endpoints

#### POST /synthesize_speech
**Purpose**: Generate Vietnamese speech from text using voice profile
**Parameters**:
- `profile_id` (optional): Voice profile identifier (defaults to "tina")
- `text` (required): Vietnamese text to synthesize
- `speed` (float, default: 1.0): Speech speed multiplier
- `guidance_scale` (float, default: 1.0): Guidance scale for quality
- `num_step` (int, default: 16): Number of inference steps
- `feat_scale` (float, default: 0.1): Feature scaling
- `target_rms` (float, default: 0.1): Target audio level
- `context_length` (int, default: 10000, max: 130000): Token limit
- `gpu_offload` (float, default: 0.9): GPU memory usage (0.0-1.0)

**Response**: WAV audio file (24kHz, mono, PCM 16-bit)

#### GET /profiles
**Purpose**: List all available voice profiles
**Response**: JSON object with profile metadata

#### POST /profiles
**Purpose**: Create new voice profile
**Parameters**:
- `name`: Unique profile identifier
- `display_name`: Human-readable name
- `description`: Profile description
- `sample_text`: Transcript for voice sample
- `sample_wav`: Audio file (WAV/MP3/M4A/FLAC)

#### DELETE /profiles/{profile_id}
**Purpose**: Delete voice profile (protects default profiles)

## File Structure

```
/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── Dockerfile             # Backend container
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Styling
│   ├── index.html            # HTML template
│   ├── package.json          # Node.js dependencies
│   ├── vite.config.js        # Vite configuration
│   └── Dockerfile            # Frontend container
├── models/
│   └── zipvoice_vi/          # Vietnamese model directory
│       ├── iter-525000-avg-2.pt
│       ├── tokens.txt
│       └── config.json
├── data/                     # Voice profiles storage
│   ├── profiles.json         # Profile metadata
│   ├── tina/                 # Default profile
│   │   ├── sample.wav
│   │   ├── sample.txt
│   │   └── input.txt
│   └── NSUT-Phu-Thang/      # Additional profile
├── docker-compose.yml        # Container orchestration
├── README.md                 # User documentation
└── MASTER_PROMPT.md         # This specification
```

## Technical Requirements

### Dependencies
**Backend**:
- Python 3.10+
- FastAPI, uvicorn, python-multipart
- soundfile, numpy (audio processing)
- ZipVoice model package
- FFmpeg (system dependency)
- eSpeak-ng (system dependency)

**Frontend**:
- Node.js 18+
- React 18, Vite 4
- Modern browser with audio support

### System Requirements
- CUDA-compatible GPU (recommended)
- Docker and Docker Compose
- 8GB+ RAM for model loading
- 10GB+ storage for models and profiles

## Configuration Parameters

### Vietnamese TTS Defaults (Optimized for Quality)
```python
VIETNAMESE_DEFAULTS = {
    "guidance_scale": 1.0,      # ZipVoice default for best quality
    "num_step": 16,             # Balanced quality/speed
    "feat_scale": 0.1,          # Default feature scaling
    "target_rms": 0.1,          # Default audio level
    "speed": 1.0,               # Normal speech speed
    "context_length": 10000,    # Default token limit
    "gpu_offload": 0.9          # 90% GPU utilization
}
```

### Model Configuration
```python
MODEL_DIR = "/models/zipvoice_vi"
CHECKPOINT_NAME = "iter-525000-avg-2.pt"
TOKENIZER = "espeak"
LANG = "vi"
DEFAULT_PROFILE = "tina"
```

## Voice Profile Structure

### Profile Directory Layout
```
data/{profile_id}/
├── sample.wav              # Voice sample audio
├── sample.txt              # Transcript of voice sample
└── input.txt               # Default text for testing
```

### Profile Metadata (profiles.json)
```json
{
  "profile_id": {
    "name": "Display Name",
    "description": "Profile description",
    "path": "/data/profile_id",
    "is_default": false,
    "created_at": "2025-08-29 12:00:00"
  }
}
```

## Frontend Features

### User Interface Components
1. **Text Input Area**: Large textarea for Vietnamese text input
2. **Profile Selector**: Dropdown for voice profile selection
3. **Quality Presets**: Quick settings for different quality levels
4. **Advanced Controls**: Expandable panel with all parameters
5. **Audio Player**: Built-in player with download functionality
6. **Vietnamese Examples**: Pre-defined sample texts
7. **Context Length Input**: Numeric field (max 130,000 tokens)

### Quality Presets
- **Cao nhất (Highest)**: guidance_scale=1.2, num_step=20
- **Cao (High)**: guidance_scale=1.1, num_step=18
- **Trung bình (Medium)**: guidance_scale=1.0, num_step=16
- **Nhanh (Fast)**: guidance_scale=0.9, num_step=12

### Vietnamese Example Texts
- Tourism: Vịnh Hạ Long descriptions
- Culture: Traditional festivals
- Daily conversation: Common phrases
- Literature: Poetry excerpts

## Known Issues and Solutions

### Issue 1: Poor Vietnamese Audio Quality
**Problem**: Generated audio sounds unnatural or garbled
**Root Cause**: Backend not using Vietnamese-trained model
**Solution**: Add `--model-dir /models/zipvoice_vi --checkpoint-name iter-525000-avg-2.pt` to inference command

### Issue 2: Sample Audio Returned Instead of Generated Audio
**Problem**: API returns original sample audio instead of synthesized speech
**Root Cause**: Inference fails silently, fallback returns sample
**Solution**: Proper error handling and validation of generated segments

### Issue 3: TSV Format Errors
**Problem**: "illegal newline value" errors during inference
**Root Cause**: Escaped newlines in TSV file generation
**Solution**: Use actual newlines `\n` instead of escaped `\\n`

## Deployment Instructions

### Development Setup
1. Clone repository with ZipVoice submodule
2. Download Vietnamese model to `models/zipvoice_vi/`
3. Prepare default voice profiles in `data/`
4. Build and run with Docker Compose

### Production Deployment
1. Ensure GPU drivers and CUDA runtime
2. Configure environment variables for paths
3. Set up volume mounts for persistence
4. Use production Docker Compose configuration
5. Configure reverse proxy (nginx) for HTTPS

## Error Handling and Validation

### Input Validation
- Text length limits (130k tokens maximum)
- Audio format validation (WAV/MP3/M4A/FLAC)
- Profile name uniqueness
- Parameter range validation

### Error Recovery
- Graceful fallback to default profile
- Automatic cleanup of temporary files
- Detailed error logging with Vietnamese messages
- User-friendly error responses

### Quality Assurance
- Audio file corruption detection
- TSV format validation
- Model checkpoint verification
- GPU memory monitoring

## Performance Optimization

### Audio Processing
- Efficient segment merging with numpy
- Proper memory management for large files
- Concurrent audio processing where possible
- Smart sentence splitting for Vietnamese prosody

### Model Inference
- GPU memory optimization
- Batch processing for multiple sentences
- Caching of frequently used profiles
- Streaming response for large audio files

## Security Considerations

### File Upload Security
- File type validation and sanitization
- Size limits on uploaded audio files
- Secure temporary file handling
- Path traversal protection

### API Security
- Input sanitization for all parameters
- Rate limiting for synthesis requests
- Profile access control
- Container isolation

## Frontend Context Length Implementation

### Numeric Input Field Requirements
```jsx
<input
  type="number"
  min="1000"
  max="130000"
  step="1000"
  value={contextLength}
  onChange={(e) => setContextLength(Number(e.target.value))}
  placeholder="Giới hạn token (tối đa 130,000)"
/>
```

## Complete Reference Implementation

### Backend Inference Function (CORRECT VERSION)
```python
def vietnamese_inference(out_dir: str, tsv_path: str, gpu_offload: float = 0.9) -> None:
    """Run Vietnamese TTS inference using ZipVoice with Vietnamese model"""
    
    env = os.environ.copy()
    env["CUDA_MEMORY_FRACTION"] = str(gpu_offload)
    env["LANG"] = "C.UTF-8"
    env["LC_ALL"] = "C.UTF-8"
    env["PYTHONIOENCODING"] = "utf-8"
    
    # CRITICAL: Must include --model-dir and --checkpoint-name for Vietnamese model
    cmd = [
        "python3", "-m", "zipvoice.bin.infer_zipvoice",
        "--model-name", "zipvoice",
        "--model-dir", "/models/zipvoice_vi",      # Vietnamese model directory
        "--checkpoint-name", "iter-525000-avg-2.pt",  # Vietnamese checkpoint
        "--tokenizer", "espeak",
        "--lang", "vi",
        "--test-list", tsv_path,
        "--res-dir", out_dir,
    ]
    
    run_command(cmd, cwd="/ZipVoice", env=env, timeout=300)
```

## File Cleanup Requirements

### Remove Test Files
- Delete any `*.wav` test files in root directory
- Remove temporary backend files
- Clean up old model checkpoints
- Remove unused configuration files

### Production File Structure
Only keep essential files for production deployment:
- Core application files
- Model files
- Default voice profiles
- Documentation files
- Docker configuration

This specification provides a complete blueprint for creating a production-ready Premium Vietnamese Text-to-Speech application with proper Vietnamese model integration, natural audio quality, and professional user interface.
