# 🚀 Hướng Dẫn Khởi Động Nhanh - Premium Vietnamese TTS v2.0

> **5 phút để chạy ứng dụng Text-to-Speech tiếng Việt chuyên nghiệp với giám sát GPU thời gian thực!**

## ⚡ Instant Setup (2 Minutes)

### 1. Prerequisites Check
```bash
# Check Docker installation
docker --version
docker compose version

# Check NVIDIA GPU (recommended for best performance)
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
- **📈 GPU Status**: http://localhost:8000/gpu_status

## 🎭 First Vietnamese Speech Generation

### Via Web Interface (Recommended)

1. **Open the application**: http://localhost:3000
2. **Enter Vietnamese text**:
   ```
   Xin chào, tôi là trợ lý ảo thông minh.
   Hôm nay trời đẹp quá!
   ```
3. **Click "Sử dụng giọng mặc định"** (Use Default Voice) - no profile required!
4. **Click "Tạo giọng nói"** (Generate Voice)
5. **Monitor real-time progress**: Watch GPU status and processing updates
6. **Listen to the result**: Audio will play automatically

### Via API (Advanced Users)

```bash
# Basic Vietnamese synthesis (Version 2.0)
curl -X POST "http://localhost:8000/synthesize_speech_v2" \
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
1. Click **"Thêm profile mới"** (Add New Profile)
2. Fill in the form:
   - **Tên profile**: `my-voice`
   - **Tên hiển thị**: `My Custom Voice`
   - **Mô tả**: `My personal Vietnamese voice`
   - **Transcript mẫu**: [exact transcript]
   - **File audio mẫu**: [upload your sample]
3. Click **"Tạo profile"** (Create Profile)

### Step 4: Test Your Voice
1. Select your new profile from the list
2. Enter any Vietnamese text (unlimited length!)
3. Generate speech with your cloned voice!

## 📊 Version 2.0 Features Overview

### ✅ **Simplified Experience**
- **No Quality Presets**: Uses optimized ZipVoice defaults
- **No Advanced Settings**: Everything works out-of-the-box
- **Unlimited Text Length**: Sentence-by-sentence processing handles any size
- **Default Voice Ready**: Start immediately without profile creation

### ✅ **Real-Time Monitoring**
- **GPU Temperature**: Monitor every 5 seconds
- **VRAM Usage**: Track memory consumption
- **Processing Progress**: See sentence-by-sentence status
- **Emergency Stop**: Halt processing if needed

### ✅ **Safety & Performance**
- **Thermal Protection**: Auto-stop at 90°C, throttle at 85°C
- **Performance Metrics**: Track last 1000 renders
- **Smart Processing**: Optimized for 85% GPU utilization
- **Automatic Cleanup**: Old files removed after 8 hours

## 🔧 Common Use Cases

### 1. Podcast Introduction
```bash
curl -X POST "http://localhost:8000/synthesize_speech_v2" \
  -F "text=Xin chào và chào mừng các bạn đến với podcast của chúng tôi. Tôi là người dẫn chương trình hôm nay." \
  --output podcast_intro.wav
```

### 2. E-learning Content
```bash
curl -X POST "http://localhost:8000/synthesize_speech_v2" \
  -F "text=Bài học hôm nay chúng ta sẽ tìm hiểu về lịch sử Việt Nam. Hãy cùng bắt đầu nhé!" \
  --output lesson_intro.wav
```

### 3. Voice Assistant Responses
```bash
curl -X POST "http://localhost:8000/synthesize_speech_v2" \
  -F "text=Tôi đã tìm thấy 5 kết quả cho yêu cầu của bạn. Bạn có muốn tôi đọc chi tiết không?" \
  --output assistant_response.wav
```

### 4. Long Document Processing
```bash
# No length limits - process entire chapters!
curl -X POST "http://localhost:8000/synthesize_speech_v2" \
  -F "text=[Your entire chapter text here - any length!]" \
  --output chapter_audio.wav
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

### Issue: High GPU Temperature
```bash
# Monitor GPU status
curl "http://localhost:8000/gpu_status" | jq .

# Emergency stop if needed
curl -X POST "http://localhost:8000/stop_render"

# System will auto-throttle at 85°C and stop at 90°C
```

### Issue: Slow Processing
```bash
# Check GPU utilization
nvidia-smi

# Version 2.0 optimizes for 85% GPU utilization
# Processing is sentence-by-sentence for stability
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
- Use shorter sentences for faster processing
- Monitor GPU temperature to prevent throttling
- Default settings are already optimized

### Optimize for Quality
- Use clean audio samples for voice cloning
- Ensure proper Vietnamese punctuation in text
- Default ZipVoice settings provide excellent quality

### Monitor System Health
```bash
# Real-time GPU monitoring
curl "http://localhost:8000/gpu_status"

# Processing status
curl "http://localhost:8000/render_status"

# Performance metrics
curl "http://localhost:8000/performance_metrics"
```

## 📈 Advanced Features

### Batch Processing Multiple Texts
```bash
# Process multiple files (sentence-by-sentence)
for text in "Câu một." "Câu hai." "Câu ba."; do
  curl -X POST "http://localhost:8000/synthesize_speech_v2" \
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

# GPU status
curl "http://localhost:8000/gpu_status" | jq .

# Recent renders
curl "http://localhost:8000/recent_renders" | jq .
```

## 🎓 Next Steps

1. **🎨 Explore the Web Interface**: Try real-time monitoring features
2. **🎤 Create Multiple Profiles**: Experiment with different voices
3. **🔧 Read Advanced Docs**: Check [MASTER_PROMPT.md](MASTER_PROMPT.md) for technical details
4. **🚀 Deploy to Production**: See [README.md](README.md) for production deployment guide
5. **📊 Monitor Performance**: Use built-in metrics for optimization

## 📞 Need Help?

- **🐛 Bug Reports**: Create an issue on GitHub
- **💡 Feature Requests**: Submit enhancement proposals
- **📚 Documentation**: Full technical docs in [MASTER_PROMPT.md](MASTER_PROMPT.md)
- **🔍 API Reference**: Interactive docs at http://localhost:8000/docs
- **📈 GPU Monitoring**: Real-time status at http://localhost:8000/gpu_status

---

<div align="center">

**🇻🇳 Happy Vietnamese TTS Generation with v2.0!**

[Back to Main Documentation](README.md) • [Technical Details](MASTER_PROMPT.md) • [Web Interface](http://localhost:3000)

</div>

## Start the Application
```bash
docker compose up -d
```

## Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **GPU Status**: http://localhost:8000/gpu_status
- **API Docs**: http://localhost:8000/docs

## Basic Usage
1. Open http://localhost:3000
2. Click "**Sử dụng giọng mặc định**" (Use Default Voice)
3. Enter Vietnamese text or click example text
4. Click "**🎤 Tạo giọng nói**" (Generate Voice)
5. Monitor GPU status and processing progress
6. Listen to the result

## Test API Directly
```bash
curl -X POST "http://localhost:8000/synthesize_speech_v2" \
  -F "text=Xin chào Việt Nam" \
  --output test.wav
```

## Version 2.0 Features Complete ✅
- ✅ **Simplified UX**: No complex settings, works out-of-the-box
- ✅ **GPU Monitoring**: Real-time temperature, utilization, VRAM tracking
- ✅ **Emergency Stop**: Safety controls for runaway processes
- ✅ **Unlimited Processing**: Sentence-by-sentence handles any text length
- ✅ **Performance Metrics**: Track last 1000 renders for optimization
- ✅ **Thermal Protection**: Auto-throttle at 85°C, stop at 90°C
- ✅ **Default Voice Ready**: Start immediately without profile creation
- ✅ **Vietnamese Optimized**: eSpeak tokenizer with vi language support
- ✅ **Real-time Feedback**: Live processing status and progress bars
- ✅ **Professional UI**: Clean interface focusing on voice quality

The application is now fully functional and optimized for Vietnamese TTS with enterprise-grade monitoring and safety features!
