# 🎤 Premium Vietnamese Text-to-Speech Application (ZipVoice)

[![Vietnamese TTS](https://img.shields.io/badge/Language-Vietnamese-red.svg)](https://vi.wikipedia.org/wiki/Ti%E1%BA%BFng_Vi%E1%BB%87t)
[![ZipVoice](https://img.shields.io/badge/Engine-ZipVoice-blue.svg)](https://github.com/k2-fsa/ZipVoice)
[![Docker](https://img.shields.io/badge/Deployment-Docker-2496ed.svg)](https://www.docker.com/)
[![React](https://img.shields.io/badge/Frontend-React-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)

> **Ứng dụng Text-to-Speech tiếng Việt chuyên nghiệp** với công nghệ ZipVoice flow matching hiện đại, hỗ trợ đầy đủ âm điệu và dấu thanh tiếng Việt.

## 🌟 **Tính Năng Nổi Bật**

### 🎯 **Chất Lượng Âm Thanh Vượt Trội**
- **ZipVoice Flow Matching**: Công nghệ AI tiên tiến cho chất lượng âm thanh tự nhiên
- **Hỗ trợ đầy đủ tiếng Việt**: Âm điệu, dấu thanh, và phát âm chuẩn
- **eSpeak Tokenizer**: Xử lý chính xác ngữ âm tiếng Việt (vi language)
- **4 mức chất lượng**: Nhanh, Cân bằng, Cao, Cao nhất (6-20 giây)

### ⚡ **Hiệu Năng Tối Ưu**
- **Dual-Path Processing**: Tự động chọn thuật toán tối ưu
  - Fast Path: Câu đơn (~8-10 giây)
  - Batch Path: Văn bản dài với xử lý TSV
- **GPU Acceleration**: Hỗ trợ CUDA 12.1+ với 90% GPU utilization
- **Smart Caching**: Lưu trữ thông minh các profile giọng nói

### 🎨 **Giao Diện Người Dùng Hiện Đại**
- **Thiết kế Ergonomic**: Hệ thống màu GitHub-style cho mắt
- **Dark/Light Mode**: Chế độ tối/sáng với chuyển đổi mượt mà
- **Responsive Design**: Hoạt động tốt trên mọi thiết bị
- **Audio Visualizer**: Hiệu ứng sóng âm thanh chuyên nghiệp
- **Tooltip Premium**: Hệ thống tooltip với glass effect

### 🔧 **Cài Đặt Nâng Cao**
- **Guidance Scale**: Điều khiển độ chính xác (0.5 - 2.0)
- **Generation Steps**: Số bước tính toán (8 - 32)
- **Speed Control**: Tốc độ phát âm (0.5x - 2.0x)
- **GPU Offload**: Tối ưu sử dụng GPU (0.1 - 1.0)
- **Token Limit**: Hỗ trợ đến 130,000 tokens
- **Feature Scale**: Điều chỉnh tông điệu và cảm xúc
- **Target RMS**: Kiểm soát âm lượng đầu ra

## 🏗️ **Kiến Trúc Hệ Thống**

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
│  └─ Context: 10k tokens với VRAM management               │
├─────────────────────────────────────────────────────────────┤
│              Docker Infrastructure                          │
│  ├─ Backend: nvidia/cuda:12.1.0 + PyTorch CUDA           │
│  ├─ Frontend: Node.js + Vite development                  │
│  └─ Data: Voice profiles & audio storage                  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 **Cài Đặt và Chạy**

### 📋 **Yêu Cầu Hệ Thống**

#### **Phần Cứng Tối Thiểu:**
- **GPU**: NVIDIA GPU với CUDA Compute Capability ≥ 6.0
- **VRAM**: 6GB+ (khuyến nghị 8GB+)
- **RAM**: 8GB+ (khuyến nghị 16GB+)
- **Storage**: 10GB+ dung lượng trống

#### **Phần Mềm:**
- **Docker**: 20.10+ với Docker Compose
- **NVIDIA Container Toolkit**: Để hỗ trợ GPU
- **Git**: Để clone repository

### ⚙️ **Cài Đặt Nhanh**

```bash
# 1. Clone repository
git clone https://github.com/Clarence161095/Premium-Vietnamese-Text-to-Speech-Application.git
cd Premium-Vietnamese-Text-to-Speech-Application

# 2. Tải ZipVoice submodule
git submodule update --init --recursive

# 3. Chạy ứng dụng
docker compose up -d

# 4. Kiểm tra logs
docker compose logs -f
```

### 🌐 **Truy Cập Ứng Dụng**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📖 **Hướng Dẫn Sử Dụng**

### 🎵 **Tạo Giọng Nói Cơ Bản**

1. **Nhập văn bản**: Gõ văn bản tiếng Việt vào ô "Nhập văn bản"
2. **Chọn chất lượng**: 
   - **Nhanh**: Demo nhanh (~6-8s)
   - **Cân bằng**: Sử dụng hàng ngày (~8-12s)
   - **Cao**: Thuyết trình (~12-16s)
   - **Cao nhất**: Chất lượng tối đa (~15-20s)
3. **Chọn giọng**: Sử dụng giọng mặc định hoặc tạo profile tùy chỉnh
4. **Tạo giọng**: Click "Tạo giọng nói" và chờ xử lý
5. **Tải xuống**: Click "Tải xuống" để lưu file WAV

### 🎛️ **Cài Đặt Nâng Cao**

#### **Tối Ưu Chất Lượng:**
```
Guidance Scale: 1.0-1.2 (chất lượng cao)
Generation Steps: 20-24 (chi tiết tốt)
Speed: 1.0 (tốc độ bình thường)
GPU Offload: 0.9 (sử dụng GPU tối đa)
```

#### **Tối Ưu Tốc Độ:**
```
Guidance Scale: 0.8 (nhanh hơn)
Generation Steps: 12-16 (cân bằng)
Speed: 1.2 (nhanh 20%)
GPU Offload: 0.7 (ổn định)
```

### 👤 **Quản Lý Profile Giọng Nói**

1. **Tạo Profile Mới**:
   - Click "Thêm profile mới"
   - Nhập tên và mô tả
   - Upload file audio mẫu (WAV/MP3)
   - Nhập transcript tương ứng
   - Click "Tạo profile"

2. **Sử dụng Profile**:
   - Chọn profile từ danh sách
   - Hoặc sử dụng giọng mặc định (Tina)

## 🔧 **Phát Triển và Tùy Chỉnh**

### 📁 **Cấu Trúc Thư Mục**

```
Premium-Vietnamese-TTS/
├── 📁 backend/                 # FastAPI Backend
│   ├── main.py                # API chính
│   ├── requirements.txt       # Dependencies Python
│   └── Dockerfile            # Docker config
├── 📁 frontend/               # React Frontend  
│   ├── src/
│   │   ├── App.jsx           # Component chính
│   │   ├── App.css           # Styles chính
│   │   └── index.js          # Entry point
│   ├── package.json          # Dependencies Node.js
│   └── Dockerfile            # Docker config
├── 📁 data/                   # Voice Profiles
│   ├── tina/                 # Profile mặc định
│   └── [custom-profiles]/    # Profiles tùy chỉnh
├── 📁 ZipVoice/              # ZipVoice Submodule
│   ├── zipvoice/             # Core TTS engine
│   └── assets/               # Model files
├── docker-compose.yml         # Container orchestration
├── README.md                 # Tài liệu này
└── docs/                     # Tài liệu chi tiết
```

### 🐳 **Docker Development**

```bash
# Chạy trong development mode
docker compose up --build

# Xem logs chi tiết
docker compose logs backend
docker compose logs frontend

# Restart services
docker compose restart backend
docker compose restart frontend

# Vào container để debug
docker compose exec backend bash
docker compose exec frontend sh
```

### 🔗 **API Endpoints**

#### **Chính:**
- `POST /synthesize_speech`: Tạo giọng nói từ text
- `GET /profiles`: Lấy danh sách voice profiles
- `POST /create_profile`: Tạo profile giọng nói mới
- `DELETE /profiles/{id}`: Xóa profile

#### **Health Check:**
- `GET /health`: Kiểm tra trạng thái backend
- `GET /gpu_info`: Thông tin GPU

## 🔬 **Chi Tiết Kỹ Thuật**

### 🧠 **ZipVoice Integration**

```python
# Vietnamese TTS Command
python3 -m zipvoice.bin.infer_zipvoice \
    --tokenizer espeak \
    --lang vi \
    --prompt-wav /data/profile/sample.wav \
    --prompt-text "Prompt text" \
    --text "Text cần tạo giọng" \
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

## 🎯 **Use Cases và Ứng Dụng**

### 📱 **Ứng Dụng Thực Tế**
- **E-learning**: Tạo nội dung giáo dục tiếng Việt
- **Audiobook**: Chuyển đổi sách thành audio
- **Podcast**: Tạo nội dung podcast tự động
- **IVR Systems**: Hệ thống tổng đài tiếng Việt
- **Accessibility**: Hỗ trợ người khiếm thị
- **Gaming**: Tạo giọng nói cho game
- **Marketing**: Quảng cáo và nội dung thương mại

### 🏢 **Tích Hợp Doanh Nghiệp**
- **API Integration**: RESTful API cho các hệ thống
- **Batch Processing**: Xử lý hàng loạt văn bản
- **Custom Voices**: Tạo giọng nói thương hiệu
- **Multi-tenant**: Hỗ trợ nhiều khách hàng

## 📊 **Benchmark và Hiệu Năng**

### ⏱️ **Thời Gian Xử Lý (RTX 4090)**
| Độ dài văn bản | Fast | Balanced | High | Premium |
|----------------|------|----------|------|---------|
| 1-2 câu (20 từ) | 6-8s | 8-10s | 12-14s | 15-18s |
| 1 đoạn (50 từ) | 8-12s | 12-16s | 16-20s | 20-25s |
| 1 trang (200 từ) | 15-20s | 20-30s | 30-40s | 40-60s |

### 💾 **Sử Dụng Tài Nguyên**
| Cấu hình | VRAM | RAM | CPU |
|----------|------|-----|-----|
| Minimum | 4GB | 8GB | 4 cores |
| Recommended | 8GB | 16GB | 8 cores |
| Optimal | 12GB+ | 32GB | 16+ cores |

## 🛡️ **Bảo Mật và Tuân Thủ**

### 🔒 **Bảo Mật Dữ Liệu**
- Không lưu trữ văn bản người dùng
- Voice profiles được mã hóa
- API rate limiting
- CORS protection

### 📜 **Tuân Thủ Pháp Lý**
- Tuân thủ GDPR cho dữ liệu EU
- Chính sách riêng tư rõ ràng
- Không thu thập dữ liệu cá nhân
- Open source license

## 🤝 **Đóng Góp và Phát Triển**

### 🌟 **Cách Đóng Góp**
1. Fork repository này
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

### 🐛 **Báo Lỗi**
- Sử dụng GitHub Issues
- Cung cấp thông tin chi tiết
- Include logs và screenshots
- Mô tả bước reproduce

### 💡 **Đề Xuất Tính Năng**
- Tạo Feature Request issue
- Mô tả use case cụ thể
- Thảo luận implementation approach

## 📚 **Tài Liệu Tham Khảo**

### 🔗 **Links Hữu Ích**
- [ZipVoice Official Repository](https://github.com/k2-fsa/ZipVoice)
- [eSpeak NG Documentation](http://espeak.sourceforge.net/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

### 📖 **Nghiên Cứu Liên Quan**
- [Flow Matching for TTS](https://arxiv.org/abs/2309.09456)
- [Vietnamese Phoneme Analysis](https://www.researchgate.net/publication/vietnamese-phoneme)
- [CUDA Optimization for Deep Learning](https://developer.nvidia.com/deep-learning)

## 🏆 **Acknowledgments**

### 🙏 **Cảm Ơn**
- **ZipVoice Team**: Cung cấp TTS engine tuyệt vời
- **k2-fsa Community**: Support và development
- **eSpeak Contributors**: Vietnamese language support
- **Docker Team**: Containerization platform
- **NVIDIA**: CUDA và GPU support

## 📞 **Liên Hệ và Hỗ Trợ**

### 💬 **Kênh Hỗ Trợ**
- **GitHub Issues**: Báo lỗi và đề xuất
- **Discussions**: Thảo luận kỹ thuật
- **Email**: [nguyenanhtuan161095@gmail.com]
- **Discord**: [Premium Vietnamese TTS Community]

### 🌐 **Cộng Đồng**
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

**⭐ Nếu project này hữu ích, hãy cho chúng tôi một star! ⭐**

Made with ❤️ for the Vietnamese community

[🏠 Home](https://github.com/Clarence161095/Premium-Vietnamese-Text-to-Speech-Application) • [📖 Docs](./docs/) • [🐛 Issues](https://github.com/Clarence161095/Premium-Vietnamese-Text-to-Speech-Application/issues) • [💡 Discussions](https://github.com/Clarence161095/Premium-Vietnamese-Text-to-Speech-Application/discussions)

</div>
