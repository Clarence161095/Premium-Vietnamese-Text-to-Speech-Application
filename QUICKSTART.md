# 🚀 Hướng Dẫn Khởi Động Nhanh - Premium Vietnamese TTS

> **5 phút để chạy ứng dụng Text-to-Speech tiếng Việt chuyên nghiệp!**

## ⚡ Instant Setup (2 Minutes)

### 1. Prerequisites Check
```bash
# Check Docker installation
docker --version
docker compose version

# Check NVIDIA GPU (optional but recommended)
nvidia-smi

# Check disk space (minimum 10GB required)
df -h
```

### 2. Clone & Start
```bash
# Clone the repository
git clone <repository-url>
cd new-zipvoice-vietnamese

# One-command deployment
docker compose up -d

# Verify services are running
docker compose ps
```

### 3. Access the Application
- **🎨 Web Interface**: http://localhost:3000
- **📊 API Documentation**: http://localhost:8000/docs
- **🔍 Health Check**: http://localhost:8000/

## 🎭 First Vietnamese Speech Generation

### Via Web Interface (Recommended)

1. **Open the application**: http://localhost:3000
2. **Enter Vietnamese text**: 
   ```
   Xin chào, tôi là trợ lý ảo thông minh. 
   Hôm nay trời đẹp quá!
   ```
3. **Select quality preset**: Choose "Balanced" for best quality/speed ratio
4. **Click "Tạo Giọng Nói"** (Generate Voice)
5. **Listen to the result**: Audio will play automatically

### Via API (Advanced Users)

```bash
# Basic Vietnamese synthesis
curl -X POST "http://localhost:8000/synthesize_speech" \
  -F "text=Xin chào Việt Nam! Tôi yêu tiếng Việt." \
  --output my_first_vietnamese.wav

# Play the audio (Linux/Mac)
play my_first_vietnamese.wav

# Play the audio (Windows)
start my_first_vietnamese.wav
```

## 🎤 Create Your First Custom Voice Profile

### Step 1: Prepare Your Voice Sample
- **Audio format**: WAV, MP3, M4A, or FLAC
- **Duration**: 10-30 seconds (optimal: 15-20 seconds)
- **Quality**: Clear voice, no background noise
- **Content**: Simple Vietnamese sentence

### Step 2: Prepare the Transcript
Write the **exact text** spoken in your audio sample:
```
Xin chào, tôi là [Your Name]. Tôi rất vui được gặp bạn.
```

### Step 3: Create Profile via Web Interface
1. Click **"Tạo Profile Mới"** (Create New Profile)
2. Fill in the form:
   - **Profile Name**: `my-voice`
   - **Display Name**: `My Custom Voice`
   - **Description**: `My personal Vietnamese voice`
   - **Sample Text**: [exact transcript]
   - **Audio File**: [upload your sample]
3. Click **"Tạo Profile"** (Create Profile)

### Step 4: Test Your Voice
1. Select your new profile from the dropdown
2. Enter any Vietnamese text
3. Generate speech with your cloned voice!

## 📊 Quality Optimization Guide

### Built-in Quality Presets

| Preset | Speed | Quality | Use Case |
|--------|--------|---------|----------|
| **⚡ Fast** | ~6-8s | Good | Quick testing, demos |
| **⚖️ Balanced** | ~8-12s | Excellent | Daily use, presentations |
| **💎 Premium** | ~15-20s | Outstanding | Final production, broadcasts |

### Manual Parameter Tuning

For advanced users, adjust these parameters in the web interface:

```javascript
// Quality vs Speed trade-offs
guidance_scale: 1.2,    // Higher = better quality (0.8-1.5)
num_step: 20,          // More steps = better quality (12-24)
speed: 1.0,            // Speech rate (0.8-1.2)
```

## 🔧 Common Use Cases

### 1. Podcast Introduction
```bash
curl -X POST "http://localhost:8000/synthesize_speech" \
  -F "text=Xin chào và chào mừng các bạn đến với podcast của chúng tôi. Tôi là người dẫn chương trình hôm nay." \
  -F "guidance_scale=1.2" \
  -F "num_step=24" \
  --output podcast_intro.wav
```

### 2. E-learning Content
```bash
curl -X POST "http://localhost:8000/synthesize_speech" \
  -F "text=Bài học hôm nay chúng ta sẽ tìm hiểu về lịch sử Việt Nam. Hãy cùng bắt đầu nhé!" \
  -F "speed=0.9" \
  --output lesson_intro.wav
```

### 3. Voice Assistant Responses
```bash
curl -X POST "http://localhost:8000/synthesize_speech" \
  -F "text=Tôi đã tìm thấy 5 kết quả cho yêu cầu của bạn. Bạn có muốn tôi đọc chi tiết không?" \
  -F "guidance_scale=1.0" \
  -F "num_step=16" \
  --output assistant_response.wav
```

## ⚠️ Troubleshooting Quick Fixes

### Issue: "Service Unavailable" Error
```bash
# Check if services are running
docker compose ps

# Restart if needed
docker compose restart

# Check logs for errors
docker compose logs backend
```

### Issue: Poor Audio Quality
```bash
# Verify Vietnamese model is loaded
docker compose logs backend | grep "Vietnamese model"

# Should see: "Using local model dir /models/zipvoice_vi"
```

### Issue: Slow Processing
```bash
# Check GPU usage
nvidia-smi

# If no GPU, processing will be slower but still work
# Reduce num_step parameter to 12 for faster processing
```

### Issue: Profile Creation Fails
```bash
# Check audio file format
file your_sample.wav

# Convert if needed (requires ffmpeg)
ffmpeg -i input.mp3 -ar 24000 -ac 1 output.wav
```

## 🎯 Performance Tips

### Optimize for Speed
- Use **Fast preset** for real-time applications
- Keep text under 100 words per request
- Use single sentences when possible

### Optimize for Quality
- Use **Premium preset** for final production
- Ensure clean audio samples for voice cloning
- Use proper Vietnamese punctuation in text

### Optimize for Resources
```bash
# Monitor resource usage
docker stats

# Adjust GPU memory usage (in docker-compose.yml)
CUDA_MEMORY_FRACTION=0.7  # Use 70% of GPU memory
```

## 📈 Advanced Features

### Batch Processing Multiple Texts
```bash
# Process multiple files
for text in "Câu một." "Câu hai." "Câu ba."; do
  curl -X POST "http://localhost:8000/synthesize_speech" \
    -F "text=$text" \
    --output "audio_$(date +%s).wav"
done
```

### Voice Profile Management
```bash
# List all available profiles
curl "http://localhost:8000/profiles" | jq .

# Delete a custom profile (not default ones)
curl -X DELETE "http://localhost:8000/profiles/my-voice"
```

### Health Monitoring
```bash
# Backend status
curl "http://localhost:8000/" | jq .

# Check processing capabilities
curl "http://localhost:8000/docs"
```

## 🎓 Next Steps

1. **🎨 Explore the Web Interface**: Try all quality presets and features
2. **🎤 Create Multiple Profiles**: Experiment with different voices
3. **🔧 Read Advanced Docs**: Check [MASTER_PROMPT.md](MASTER_PROMPT.md) for technical details
4. **🚀 Deploy to Production**: See [README.md](README.md) for production deployment guide

## 📞 Need Help?

- **🐛 Bug Reports**: Create an issue on GitHub
- **💡 Feature Requests**: Submit enhancement proposals
- **📚 Documentation**: Full technical docs in [MASTER_PROMPT.md](MASTER_PROMPT.md)
- **🔍 API Reference**: Interactive docs at http://localhost:8000/docs

---

<div align="center">

**🇻🇳 Happy Vietnamese TTS Generation!**

[Back to Main Documentation](README.md) • [Technical Details](MASTER_PROMPT.md) • [Web Interface](http://localhost:3000)

</div>

## Start the Application
```bash
docker compose up -d
```

## Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

## Basic Usage
1. Open http://localhost:3000
2. Click "**Sử dụng giọng mặc định**" (Use Default Voice)
3. Enter Vietnamese text or click example text
4. Click "**🎤 Tạo giọng nói tiếng Việt**" (Generate Vietnamese Speech)
5. Wait 5-15 seconds for audio generation

## Test API Directly
```bash
curl -X POST "http://localhost:8000/synthesize_speech" \
  -F "text=Xin chào Việt Nam" \
  --output test.wav
```

## Features Complete ✅
- ✅ Default Vietnamese voice (no profile required)
- ✅ Custom voice profile management
- ✅ Advanced configuration (10k tokens, 90% GPU)
- ✅ Optimized for Vietnamese (eSpeak + vi tokenizer)
- ✅ Fast processing for short sentences (~10 seconds)
- ✅ Vietnamese UI with examples and presets
- ✅ Quality presets (High Quality, Balanced, Fast)

The application is now fully functional and optimized for Vietnamese TTS!
