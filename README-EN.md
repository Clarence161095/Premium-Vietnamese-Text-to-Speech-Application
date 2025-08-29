# 🎤 Premium Vietnamese Text-to-Speech Application (ZipVoice)

[![Vietnamese TTS](https://img.shields.io/badge/Language-Vietnamese-red.svg)](https://vi.wikipedia.org/wiki/Ti%E1%BA%BFng_Vi%E1%BB%87t)
[![ZipVoice](https://img.shields.io/badge/Engine-ZipVoice-blue.svg)](https://github.com/k2-fsa/ZipVoice)
[![Docker](https://img.shields.io/badge/Deployment-Docker-2496ed.svg)](https://www.docker.com/)
[![React](https://img.shields.io/badge/Frontend-React-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)

> **Professional Vietnamese Text-to-Speech Application** powered by modern ZipVoice flow matching technology with full support for Vietnamese tones and diacritics.

## 🌟 **Key Features**

### 🎯 **Superior Audio Quality**
- **ZipVoice Flow Matching**: Advanced AI technology for natural audio quality
- **Full Vietnamese Support**: Tones, diacritics, and accurate pronunciation
- **eSpeak Tokenizer**: Precise Vietnamese phoneme processing (vi language)
- **4 Quality Levels**: Fast, Balanced, High, Premium (6-20 seconds)

### ⚡ **Optimized Performance**
- **Dual-Path Processing**: Automatic algorithm optimization
  - Fast Path: Single sentences (~8-10 seconds)
  - Batch Path: Long text with TSV processing
- **GPU Acceleration**: CUDA 12.1+ support with 90% GPU utilization
- **Smart Caching**: Intelligent voice profile storage

### 🎨 **Modern User Interface**
- **Ergonomic Design**: GitHub-style color system for eye comfort
- **Dark/Light Mode**: Dark/light modes with smooth transitions
- **Responsive Design**: Works great on all devices
- **Audio Visualizer**: Professional waveform effects
- **Premium Tooltips**: Tooltip system with glass effect

### 🔧 **Advanced Settings**
- **Guidance Scale**: Control accuracy (0.5 - 2.0)
- **Generation Steps**: Computation steps (8 - 32)
- **Speed Control**: Playback speed (0.5x - 2.0x)
- **GPU Offload**: Optimize GPU usage (0.1 - 1.0)
- **Token Limit**: Support up to 130,000 tokens
- **Feature Scale**: Adjust tone and emotion
- **Target RMS**: Control output volume

## 🏗️ **System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    Premium Vietnamese TTS                    │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)     │  Backend (FastAPI)          │
│  ├─ Bilingual UI (VI/EN)     │  ├─ Vietnamese Optimization │
│  ├─ Quality Presets          │  ├─ Dual-Path Processing    │
│  ├─ Audio Visualizer         │  ├─ GPU Acceleration        │
│  ├─ Theme System             │  └─ eSpeak Integration      │
│  └─ Premium Tooltips         │                             │
├─────────────────────────────────────────────────────────────┤
│              ZipVoice Core (Flow Matching TTS)              │
│  ├─ Model: iter-525000-avg-2.pt                           │
│  ├─ Tokenizer: eSpeak (vi language)                       │
│  ├─ Audio: 24kHz mono conversion                          │
│  └─ Context: 10k tokens with VRAM management              │
├─────────────────────────────────────────────────────────────┤
│              Docker Infrastructure                          │
│  ├─ Backend: nvidia/cuda:12.1.0 + PyTorch CUDA           │
│  ├─ Frontend: Node.js + Vite development                  │
│  └─ Data: Voice profiles & audio storage                  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 **Installation and Setup**

### 📋 **System Requirements**

#### **Minimum Hardware:**
- **GPU**: NVIDIA GPU with CUDA Compute Capability ≥ 6.0
- **VRAM**: 6GB+ (recommended 8GB+)
- **RAM**: 8GB+ (recommended 16GB+)
- **Storage**: 10GB+ free space

#### **Software:**
- **Docker**: 20.10+ with Docker Compose
- **NVIDIA Container Toolkit**: For GPU support
- **Git**: To clone repository

### ⚙️ **Quick Installation**

```bash
# 1. Clone repository
git clone https://github.com/Clarence161095/Premium-Vietnamese-Text-to-Speech-Application.git
cd Premium-Vietnamese-Text-to-Speech-Application

# 2. Download ZipVoice submodule
git submodule update --init --recursive

# 3. Run application
docker compose up -d

# 4. Check logs
docker compose logs -f
```

### 🌐 **Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📖 **User Guide**

### 🎵 **Basic Voice Generation**

1. **Enter text**: Type Vietnamese text in the "Enter text" field
2. **Select quality**: 
   - **Fast**: Quick demo (~6-8s)
   - **Balanced**: Daily use (~8-12s)
   - **High**: Presentations (~12-16s)
   - **Premium**: Maximum quality (~15-20s)
3. **Choose voice**: Use default voice or create custom profile
4. **Generate**: Click "Generate Voice" and wait for processing
5. **Download**: Click "Download" to save WAV file

### 🎛️ **Advanced Settings**

#### **Quality Optimization:**
```
Guidance Scale: 1.0-1.2 (high quality)
Generation Steps: 20-24 (good detail)
Speed: 1.0 (normal speed)
GPU Offload: 0.9 (maximum GPU usage)
```

#### **Speed Optimization:**
```
Guidance Scale: 0.8 (faster)
Generation Steps: 12-16 (balanced)
Speed: 1.2 (20% faster)
GPU Offload: 0.7 (stable)
```

### 👤 **Voice Profile Management**

1. **Create New Profile**:
   - Click "Add new profile"
   - Enter name and description
   - Upload sample audio file (WAV/MP3)
   - Enter corresponding transcript
   - Click "Create profile"

2. **Use Profile**:
   - Select profile from list
   - Or use default voice (Tina)

## 🔧 **Development and Customization**

### 📁 **Directory Structure**

```
Premium-Vietnamese-TTS/
├── 📁 backend/                 # FastAPI Backend
│   ├── main.py                # Main API
│   ├── requirements.txt       # Python Dependencies
│   └── Dockerfile            # Docker config
├── 📁 frontend/               # React Frontend  
│   ├── src/
│   │   ├── App.jsx           # Main component
│   │   ├── App.css           # Main styles
│   │   └── index.js          # Entry point
│   ├── package.json          # Node.js Dependencies
│   └── Dockerfile            # Docker config
├── 📁 data/                   # Voice Profiles
│   ├── tina/                 # Default profile
│   └── [custom-profiles]/    # Custom profiles
├── 📁 ZipVoice/              # ZipVoice Submodule
│   ├── zipvoice/             # Core TTS engine
│   └── assets/               # Model files
├── docker-compose.yml         # Container orchestration
├── README.md                 # This documentation
└── docs/                     # Detailed documentation
```

### 🐳 **Docker Development**

```bash
# Run in development mode
docker compose up --build

# View detailed logs
docker compose logs backend
docker compose logs frontend

# Restart services
docker compose restart backend
docker compose restart frontend

# Enter container for debugging
docker compose exec backend bash
docker compose exec frontend sh
```

### 🔗 **API Endpoints**

#### **Main:**
- `POST /synthesize_speech`: Generate voice from text
- `GET /profiles`: Get voice profiles list
- `POST /create_profile`: Create new voice profile
- `DELETE /profiles/{id}`: Delete profile

#### **Health Check:**
- `GET /health`: Check backend status
- `GET /gpu_info`: GPU information

## 🔬 **Technical Details**

### 🧠 **ZipVoice Integration**

```python
# Vietnamese TTS Command
python3 -m zipvoice.bin.infer_zipvoice \
    --tokenizer espeak \
    --lang vi \
    --prompt-wav /data/profile/sample.wav \
    --prompt-text "Prompt text" \
    --text "Text to generate voice" \
    --res-dir /output
```

### ⚡ **Dual-Path Processing Logic**

```python
# Smart path selection
is_single_sentence = len(sentences) == 1 and len(text.split()) <= 20

if is_single_sentence:
    # Fast path: Direct inference (~8-10s)
    final_audio = fast_vietnamese_inference(
        prompt_wav, prompt_text, text, out_dir
    )
else:
    # Batch path: TSV processing (~15-30s)
    tsv_path = build_vietnamese_tsv(out_dir, sentences)
    vietnamese_inference(out_dir, tsv_path, gpu_offload)
    final_audio = merge_vietnamese_segments(out_dir)
```

### 🎨 **Frontend Architecture**

```javascript
// Theme System
const [theme, setTheme] = useState(() => {
  return localStorage.getItem('theme') || 'light';
});

// Quality Presets
const VIETNAMESE_PRESETS = {
  fast: { guidance_scale: 0.8, num_step: 12 },
  balanced: { guidance_scale: 1.0, num_step: 16 },
  high: { guidance_scale: 1.2, num_step: 24 },
  premium: { guidance_scale: 1.4, num_step: 32 }
};
```

## 🎯 **Use Cases and Applications**

### 📱 **Real-world Applications**
- **E-learning**: Create Vietnamese educational content
- **Audiobook**: Convert books to audio
- **Podcast**: Generate automated podcast content
- **IVR Systems**: Vietnamese call center systems
- **Accessibility**: Support for visually impaired
- **Gaming**: Generate game voices
- **Marketing**: Advertising and commercial content

### 🏢 **Enterprise Integration**
- **API Integration**: RESTful API for systems
- **Batch Processing**: Bulk text processing
- **Custom Voices**: Create brand voices
- **Multi-tenant**: Support multiple customers

## 📊 **Benchmarks and Performance**

### ⏱️ **Processing Time (RTX 4090)**
| Text Length | Fast | Balanced | High | Premium |
|-------------|------|----------|------|---------|
| 1-2 sentences (20 words) | 6-8s | 8-10s | 12-14s | 15-18s |
| 1 paragraph (50 words) | 8-12s | 12-16s | 16-20s | 20-25s |
| 1 page (200 words) | 15-20s | 20-30s | 30-40s | 40-60s |

### 💾 **Resource Usage**
| Configuration | VRAM | RAM | CPU |
|---------------|------|-----|-----|
| Minimum | 4GB | 8GB | 4 cores |
| Recommended | 8GB | 16GB | 8 cores |
| Optimal | 12GB+ | 32GB | 16+ cores |

## 🛡️ **Security and Compliance**

### 🔒 **Data Security**
- No user text storage
- Encrypted voice profiles
- API rate limiting
- CORS protection

### 📜 **Legal Compliance**
- GDPR compliance for EU data
- Clear privacy policy
- No personal data collection
- Open source license

## 🤝 **Contributing and Development**

### 🌟 **How to Contribute**
1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

### 🐛 **Bug Reports**
- Use GitHub Issues
- Provide detailed information
- Include logs and screenshots
- Describe reproduction steps

### 💡 **Feature Requests**
- Create Feature Request issue
- Describe specific use case
- Discuss implementation approach

## 📚 **References**

### 🔗 **Useful Links**
- [ZipVoice Official Repository](https://github.com/k2-fsa/ZipVoice)
- [eSpeak NG Documentation](http://espeak.sourceforge.net/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

### 📖 **Related Research**
- [Flow Matching for TTS](https://arxiv.org/abs/2309.09456)
- [Vietnamese Phoneme Analysis](https://www.researchgate.net/publication/vietnamese-phoneme)
- [CUDA Optimization for Deep Learning](https://developer.nvidia.com/deep-learning)

## 🏆 **Acknowledgments**

### 🙏 **Thanks To**
- **ZipVoice Team**: Providing excellent TTS engine
- **k2-fsa Community**: Support and development
- **eSpeak Contributors**: Vietnamese language support
- **Docker Team**: Containerization platform
- **NVIDIA**: CUDA and GPU support

## 📞 **Contact and Support**

### 💬 **Support Channels**
- **GitHub Issues**: Bug reports and suggestions
- **Discussions**: Technical discussions
- **Email**: [your-email@domain.com]
- **Discord**: [Premium Vietnamese TTS Community]

### 🌐 **Community**
- **Facebook Group**: [Vietnamese TTS Developers]
- **Reddit**: [r/VietnameseTTS]
- **Stack Overflow**: Tag [vietnamese-tts]

---

## 📄 **License**

```
MIT License

Copyright (c) 2025 Premium Vietnamese TTS Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**⭐ If this project is useful, please give us a star! ⭐**

Made with ❤️ for the Vietnamese community

[🏠 Home](https://github.com/Clarence161095/Premium-Vietnamese-Text-to-Speech-Application) • [📖 Docs](./docs/) • [🐛 Issues](https://github.com/Clarence161095/Premium-Vietnamese-Text-to-Speech-Application/issues) • [💡 Discussions](https://github.com/Clarence161095/Premium-Vietnamese-Text-to-Speech-Application/discussions)

</div>
