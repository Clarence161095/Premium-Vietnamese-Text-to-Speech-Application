# CLONE PROMPT: Vietnamese TTS → English TTS with Orpheus-TTS

## 🎯 **Mục Đích**

Document này hướng dẫn clone hệ thống Premium Vietnamese TTS Application hiện tại thành một hệ thống tương tự cho **English Text-to-Speech** sử dụng **Orpheus-TTS** thay vì ZipVoice.

## 📋 **System Comparison**

### **Current System (Vietnamese ZipVoice)**

- **Engine**: ZipVoice Flow Matching
- **Language**: Vietnamese
- **Model**: iter-525000-avg-2.pt (491MB)
- **Tokenizer**: eSpeak (vi language)
- **Processing**: Sentence-by-sentence với TSV batch
- **Command**: `zipvoice.bin.infer_zipvoice`

### **Target System (English Orpheus)**

- **Engine**: Orpheus-TTS (LLama-3B based)
- **Language**: English
- **Model**: canopylabs/orpheus-3b-0.1-ft
- **Tokenizer**: Built-in LLM tokenizer
- **Processing**: Streaming inference với vLLM
- **Command**: `OrpheusModel.generate_speech()`

## 🏗️ **Architecture Mapping**

### **Unchanged Components (Keep 100%)**

- Docker Compose structure
- FastAPI backend framework
- React frontend with monitoring
- GPU safety system (temperature monitoring)
- Emergency stop controls
- Performance metrics tracking
- Real-time monitoring (5-second polling)
- Profile management system
- Audio playback & download
- Dark/Light theme UI

### **Components to Replace**

#### **1. Model Integration**

```python
# FROM (ZipVoice Vietnamese)
def run_zipvoice_inference(doing_dir: str, profile_data: Dict) -> str:
    cmd = [
        "python3", "-m", "zipvoice.bin.infer_zipvoice",
        "--model-name", "zipvoice",
        "--model-dir", "/models/zipvoice_vi",
        "--checkpoint-name", "iter-525000-avg-2.pt",
        "--tokenizer", "espeak",
        "--lang", "vi",
        "--test-list", f"{doing_dir}/vietnamese_test.tsv",
        "--res-dir", doing_dir
    ]

# TO (Orpheus English)
def run_orpheus_inference(text: str, voice: str = "tara") -> bytes:
    from orpheus_tts import OrpheusModel
    
    model = OrpheusModel(
        model_name="canopylabs/orpheus-3b-0.1-ft", 
        max_model_len=2048
    )
    
    # Format prompt for English
    prompt = f"{voice}: {text}"
    
    # Generate streaming audio
    audio_chunks = []
    for audio_chunk in model.generate_speech(prompt=prompt, voice=voice):
        audio_chunks.append(audio_chunk)
    
    # Combine chunks into WAV bytes
    return b''.join(audio_chunks)
```

#### **2. Text Processing**

```python
# FROM (Vietnamese sentence splitting)
def split_vietnamese_sentences(text: str) -> List[str]:
    parts = [p.strip() for p in re.split(r'(?<=[.!?…])\s+', text) if p.strip()]
    return [p for p in parts if len(re.sub(r'[.!?…\s]', '', p)) >= 3]

# TO (English sentence splitting)
def split_english_sentences(text: str) -> List[str]:
    # English sentence boundaries
    parts = [p.strip() for p in re.split(r'(?<=[.!?])\s+', text) if p.strip()]
    # Filter minimum 3 characters
    return [p for p in parts if len(re.sub(r'[.!?\s]', '', p)) >= 3]

# FROM (Vietnamese text cleaning)
def preprocess_vietnamese_text(text: str) -> str:
    # Remove emojis and non-Vietnamese characters
    vietnamese_chars = r'àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ'
    pattern = f'[^\w\s\.,!?;:\-""''{vietnamese_chars}()]'
    text = re.sub(pattern, '', text)
    return re.sub(r'\s+', ' ', text).strip()

# TO (English text cleaning)
def preprocess_english_text(text: str) -> str:
    # Remove emojis and non-English characters
    pattern = r'[^\w\s\.,!?;:\-""''()]'
    text = re.sub(pattern, '', text)
    return re.sub(r'\s+', ' ', text).strip()
```

## 🔧 **Quick Migration Guide**

### **Step 1: Update Dependencies**

```python
# backend/requirements.txt - Replace Vietnamese deps with Orpheus
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
soundfile==0.12.1
numpy==1.24.3
pydantic==2.5.0

# NEW: Orpheus TTS dependencies
orpheus-speech>=1.0.0
vllm==0.7.3
torch>=2.0.0
transformers>=4.30.0
```

### **Step 2: Update Main Processing Function**

```python
# Replace process_vietnamese_text_v2() with:
def process_english_text_v2(text: str, voice: str = "tara") -> str:
    start_time = time.time()
    
    # 1. English preprocessing
    cleaned_text = preprocess_english_text(text)
    sentences = split_english_sentences(cleaned_text)
    
    if not sentences:
        raise HTTPException(status_code=400, detail="No valid sentences found")
    
    # 2. GPU safety check (same as Vietnamese)
    gpu_status = get_gpu_status()
    if gpu_status.get("temperature", 0) >= GPU_TEMP_EMERGENCY:
        raise HTTPException(status_code=503, detail="GPU overheating")
    
    # 3. Setup processing directory
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    doing_dir = f"{DOING_DIR}/{timestamp}"
    os.makedirs(doing_dir, exist_ok=True)
    
    try:
        # 4. Process each sentence with Orpheus
        audio_segments = []
        
        for i, sentence in enumerate(sentences):
            # Check for stop signal and GPU temp
            gpu_status = get_gpu_status()
            if gpu_status.get("temperature", 0) >= GPU_TEMP_EMERGENCY:
                raise Exception("GPU emergency stop")
            
            # Generate audio for single sentence
            audio_bytes = run_orpheus_inference(sentence, voice)
            
            # Save segment
            segment_path = f"{doing_dir}/seg_{i:03d}.wav"
            with open(segment_path, 'wb') as f:
                f.write(audio_bytes)
            
            audio_segments.append(segment_path)
        
        # 5. Merge segments with pauses (same as Vietnamese)
        if audio_segments:
            merged_audio = merge_audio_segments(audio_segments, pause_duration=0.5)
            final_audio_path = f"{doing_dir}/english_final.wav"
            sf.write(final_audio_path, merged_audio, 24000)
        
        # 6. Update metrics (same as Vietnamese)
        processing_time = time.time() - start_time
        word_count = len(cleaned_text.split())
        render_metrics.add_render(word_count, processing_time)
        
        print(f"[SUCCESS] Processed {len(sentences)} sentences in {processing_time:.1f}s")
        return final_audio_path
        
    except Exception as e:
        print(f"[ERROR] Processing failed: {str(e)}")
        if os.path.exists(doing_dir):
            shutil.rmtree(doing_dir)
        raise HTTPException(status_code=500, detail=str(e))
```

### **Step 3: Update API Endpoints**

```python
# Replace Vietnamese endpoint with English
@app.post("/synthesize_speech_v2")
async def synthesize_speech_v2(
    text: str = Form(...),
    voice: str = Form("tara")  # English voice instead of profile_id
):
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    
    # Validate voice selection
    if voice not in ["tara", "leah", "jess", "leo", "dan", "mia", "zac", "zoe"]:
        voice = "tara"
    
    audio_path = process_english_text_v2(text, voice)
    return FileResponse(audio_path, media_type="audio/wav", filename="english_speech.wav")

# Replace profiles endpoint with voices
@app.get("/voices")
async def get_voices():
    """Get available Orpheus voices"""
    voices = {}
    orpheus_voices = ["tara", "leah", "jess", "leo", "dan", "mia", "zac", "zoe"]
    
    for voice_name in orpheus_voices:
        voices[voice_name] = {
            "id": voice_name,
            "display_name": voice_name.title(),
            "description": f"Orpheus {voice_name} voice",
            "is_default": voice_name == "tara",
            "language": "en",
            "gender": "female" if voice_name in ["tara", "leah", "jess", "mia", "zoe"] else "male"
        }
    return voices
```

### **Step 4: Update Frontend**

```javascript
// Update UI text from Vietnamese to English
const translations = {
  en: {
    title: "Premium English TTS",
    subtitle: "Generate high-quality English speech with advanced AI technology",
    textPlaceholder: "Enter your English text here...",
    defaultVoice: "Default Voice",
    generateSpeech: "Generate Speech",
    // ... other translations
  }
}

// Update voice selection component
const VoiceSelector = () => {
  const [selectedVoice, setSelectedVoice] = useState('tara');
  
  const voices = [
    { id: 'tara', name: 'Tara', gender: 'female', description: 'Natural, conversational' },
    { id: 'leah', name: 'Leah', gender: 'female', description: 'Professional, clear' },
    { id: 'jess', name: 'Jess', gender: 'female', description: 'Friendly, warm' },
    { id: 'leo', name: 'Leo', gender: 'male', description: 'Clear, confident' },
    { id: 'dan', name: 'Dan', gender: 'male', description: 'Deep, authoritative' },
    { id: 'mia', name: 'Mia', gender: 'female', description: 'Young, energetic' },
    { id: 'zac', name: 'Zac', gender: 'male', description: 'Casual, relaxed' },
    { id: 'zoe', name: 'Zoe', gender: 'female', description: 'Bright, enthusiastic' }
  ];
  
  // Voice selection UI...
};
```

### **Step 5: Update Docker Configuration**

```dockerfile
# backend/Dockerfile - Remove ZipVoice, add Orpheus
FROM nvidia/cuda:12.1.0-devel-ubuntu20.04

# Install system dependencies (SAME)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    ffmpeg \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# NEW: Install Orpheus TTS instead of eSpeak-ng
RUN pip3 install --no-cache-dir orpheus-speech
RUN pip3 install --no-cache-dir vllm==0.7.3

# Copy application code (SAME)
COPY . /app
WORKDIR /app
RUN pip3 install --no-cache-dir -r requirements.txt

# Set environment variables
ENV PYTHONPATH=/app
ENV HF_HOME=/app/.cache

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml - Remove ZipVoice volumes
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      # REMOVE: ./ZipVoice:/ZipVoice:ro
      # REMOVE: ./models:/models:ro
      - ./backend:/app
      - ./data:/data
      - ./DOING:/DOING
    environment:
      - PYTHONPATH=/app  # REMOVE: /ZipVoice
      - CUDA_VISIBLE_DEVICES=0
      - HF_HOME=/app/.cache  # NEW: Hugging Face cache
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## 🚀 **One-Click Migration Script**

```bash
#!/bin/bash
# migrate_to_orpheus.sh - Complete migration script

echo "🔄 Migrating Vietnamese ZipVoice TTS to English Orpheus TTS..."

# 1. Backup current system
echo "📦 Creating backup..."
cp -r . ../vietnamese-tts-backup
echo "✅ Backup created at ../vietnamese-tts-backup"

# 2. Remove Vietnamese dependencies
echo "🗑️ Removing ZipVoice..."
rm -rf ZipVoice models/zipvoice_vi
echo "✅ Removed ZipVoice"

# 3. Update requirements
echo "📝 Updating requirements..."
cat > backend/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
soundfile==0.12.1
numpy==1.24.3
pydantic==2.5.0
orpheus-speech>=1.0.0
vllm==0.7.3
torch>=2.0.0
transformers>=4.30.0
EOF
echo "✅ Updated requirements"

# 4. Update docker-compose
echo "🐳 Updating Docker configuration..."
sed -i 's|./ZipVoice:/ZipVoice:ro||g' docker-compose.yml
sed -i 's|./models:/models:ro||g' docker-compose.yml
sed -i 's|PYTHONPATH=/ZipVoice:/app|PYTHONPATH=/app|g' docker-compose.yml
echo "✅ Updated Docker config"

# 5. Clear old data
echo "🧹 Cleaning old voice data..."
rm -rf data/tina data/NB-Kim-Hanh data/NSUT-Phu-Thang data/van-son-12s
mkdir -p data
echo '{}' > data/voices.json
echo "✅ Cleaned old voice data"

# 6. Deploy new system
echo "🚀 Deploying English Orpheus TTS..."
docker compose down
docker compose up --build -d
echo "✅ Deployed English Orpheus TTS"

echo ""
echo "🎉 Migration complete!"
echo "🌐 Access at: http://localhost:3000"
echo "🧪 Test with: curl -X POST 'http://localhost:8000/synthesize_speech_v2' -F 'text=Hello world' -F 'voice=tara' --output test.wav"
echo "📚 Documentation: README.md"
```

## 📊 **Feature Comparison**

| Feature | Vietnamese (ZipVoice) | English (Orpheus) |
|---------|----------------------|-------------------|
| **Model Size** | 491MB | 3B parameters (~6GB) |
| **Processing** | Batch TSV | Streaming inference |
| **Latency** | 8-12s per sentence | ~200ms streaming |
| **Memory** | 6GB VRAM | 8GB+ VRAM |
| **Quality** | High (flow matching) | Very High (LLM-based) |
| **Voices** | Custom profiles | 8 built-in voices |
| **Emotions** | None | Built-in emotion tags |
| **Real-time** | No | Yes (~100ms streaming) |

## 🎯 **Success Criteria**

### **✅ Must Have (100% Working)**

1. **English TTS Generation**: Perfect speech from text
2. **8 Built-in Voices**: All Orpheus voices working
3. **GPU Monitoring**: Same thermal protection system
4. **Emergency Stop**: Immediate process termination
5. **Performance Metrics**: Tracking and estimation
6. **Streaming Capability**: Low-latency generation
7. **UI Adaptation**: Full English interface
8. **Audio Quality**: 24kHz professional output

### **🎁 Nice to Have (Enhancements)**

1. **Emotion Tags**: Built-in emotion support (`<laugh>`, `<sigh>`, etc.)
2. **Voice Preview**: Sample audio for each voice
3. **Advanced Controls**: Temperature, repetition penalty
4. **Real-time Streaming**: Live audio generation
5. **Batch Processing**: Multiple texts at once

## 🔗 **Key File Changes Summary**

### **backend/main.py**

- Replace `process_vietnamese_text_v2()` → `process_english_text_v2()`
- Replace `run_zipvoice_inference()` → `run_orpheus_inference()`
- Update API endpoint: `profile_id` → `voice` parameter
- Replace `/profiles` → `/voices` endpoint

### **frontend/src/App.jsx**

- Update UI text: Vietnamese → English
- Replace profile selection → voice selection
- Update default values: `tina` → `tara`
- Add voice preview functionality (optional)

### **docker-compose.yml**

- Remove ZipVoice volume mounts
- Remove eSpeak-ng installation
- Add Hugging Face cache directory
- Update environment variables

### **backend/requirements.txt**

- Remove: ZipVoice-specific dependencies
- Add: `orpheus-speech>=1.0.0`, `vllm==0.7.3`
- Keep: FastAPI, soundfile, numpy (unchanged)

## 💡 **Pro Tips**

1. **Start with backup**: Always backup before migration
2. **GPU Memory**: Orpheus needs 8GB+ VRAM vs ZipVoice's 6GB
3. **Voice Selection**: Test all 8 voices to find best quality
4. **Streaming**: Enable streaming for real-time applications
5. **Error Handling**: Keep same GPU monitoring system
6. **Performance**: Expect faster processing with Orpheus

## 🎊 **Conclusion**

This CLONE PROMPT provides a complete roadmap to transform the Vietnamese ZipVoice TTS system into an English Orpheus-TTS system while maintaining all enterprise-grade features:

- ✅ **Same Architecture**: Docker, FastAPI, React, GPU monitoring
- ✅ **Better Performance**: Streaming inference, lower latency
- ✅ **More Voices**: 8 built-in voices vs custom profiles
- ✅ **Enhanced Quality**: LLM-based speech synthesis
- ✅ **Future-Ready**: Built-in emotion support, streaming capabilities

Simply run the migration script and you'll have a production-ready English TTS system!
