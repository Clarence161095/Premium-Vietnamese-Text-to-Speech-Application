# 🚀 Quick Start Guide - Premium Vietnamese TTS

> **Get your professional Vietnamese Text-to-Speech application running in under 5 minutes!**

## 📋 **Prerequisites Check**

### ✅ **System Requirements**
- **🖥️ NVIDIA GPU**: CUDA Compute Capability ≥ 6.0
- **💾 VRAM**: 6GB+ (8GB+ recommended)
- **🧠 RAM**: 8GB+ system memory
- **💽 Storage**: 10GB+ free space

### 🔧 **Required Software**
```bash
# Check Docker installation
docker --version
# Expected: Docker version 20.10.0+

# Check Docker Compose
docker compose version
# Expected: Docker Compose version v2.0.0+

# Verify NVIDIA Container Toolkit
docker run --rm --gpus all nvidia/cuda:11.0.3-base-ubuntu20.04 nvidia-smi
# Expected: GPU information display
```

## ⚡ **Lightning Setup (3 Steps)**

### **Step 1: Clone Repository**
```bash
git clone https://github.com/Clarence161095/Premium-Vietnamese-Text-to-Speech-Application.git
cd Premium-Vietnamese-Text-to-Speech-Application
```

### **Step 2: Download ZipVoice Model**
```bash
git submodule update --init --recursive
```

### **Step 3: Launch Application**
```bash
docker compose up -d
```

## 🎯 **Access Application**

Once running successfully, access:

- **🎨 Main Interface**: http://localhost:3000
- **📊 API Documentation**: http://localhost:8000/docs
- **💚 Health Check**: http://localhost:8000/health

## 🎵 **First Voice Test**

### **Create Your First Vietnamese Voice**

1. **Open browser**: Navigate to http://localhost:3000
2. **Enter text**: 
   ```
   Hello! I am the most modern Vietnamese TTS system.
   ```
3. **Select quality**: "Balanced" (default)
4. **Click "Generate Voice"**: Wait 8-12 seconds
5. **Listen to result**: Click Play button
6. **Download**: Click "Download" to save WAV file

### **🎭 Try Built-in Examples**

The application includes Vietnamese sample phrases:

- **Formal**: "Greetings customers, welcome to the system."
- **Casual**: "What a beautiful day, let's go for a walk!"
- **Technical**: "Artificial intelligence is changing the world."

## 🔧 **Quality Customization**

### **📊 Available Presets**

| Mode | Time | Quality | Use Case |
|------|------|---------|----------|
| **Fast** | 6-8s | Good | Quick demos |
| **Balanced** | 8-12s | Very Good | Daily use |
| **High** | 12-16s | Excellent | Presentations |
| **Premium** | 15-20s | Perfect | Maximum quality |

### **⚙️ Advanced Settings**

Open "Advanced Settings" to adjust:

- **Guidance Scale**: 1.0 (standard) → 1.2 (high quality)
- **Generation Steps**: 16 (fast) → 24 (detailed)
- **Speed**: 1.0 (normal) → 0.8 (slower, clearer)

## 👤 **Custom Voice Creation**

### **🎤 Prepare Sample Audio**

1. **Record**: WAV or MP3 file, 3-10 seconds
2. **Quality**: 16kHz+, mono or stereo
3. **Content**: Clear speech, no noise
4. **Transcript**: Prepare accurate text

### **📝 Create Profile**

1. **Click "Add New Profile"**
2. **Enter information**:
   - **Name**: e.g., "Northern Male Voice"
   - **Description**: e.g., "Young male, formal style"
3. **Upload audio file**: Drag & drop or select
4. **Enter transcript**: 100% accurate
5. **Click "Create Profile"**: Wait for processing

## 🔍 **Troubleshooting**

### **❌ Common Issues**

#### **GPU Not Detected**
```bash
# Check NVIDIA driver
nvidia-smi

# Install NVIDIA Container Toolkit
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
```

#### **Containers Won't Start**
```bash
# Check logs
docker compose logs backend
docker compose logs frontend

# Restart services
docker compose restart
```

#### **"Port Already in Use" Error**
```bash
# Check ports in use
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000

# Stop running services
docker compose down
```

### **⚠️ Audio Not Generated**

1. **Check VRAM**: Need at least 4GB
2. **Check text**: No unusual special characters
3. **Try shorter text**: Start with 1-2 sentences
4. **Check logs**: `docker compose logs backend`

### **🔧 Complete Reset**

```bash
# Stop and remove containers
docker compose down -v

# Remove images (if needed)
docker compose down --rmi all

# Remove volumes (warning: data loss)
docker volume prune

# Restart fresh
docker compose up -d --build
```

## 📊 **Performance Monitoring**

### **⏱️ Expected Processing Times**

- **RTX 4090**: 6-15 seconds
- **RTX 3080**: 8-20 seconds  
- **RTX 3060**: 12-30 seconds
- **GTX 1660**: 20-45 seconds

### **💾 Resource Usage**

```bash
# Monitor GPU usage
watch -n 1 nvidia-smi

# Monitor RAM usage
docker stats

# Check disk usage
du -sh .
```

## 🎯 **Next Steps**

### **📚 Detailed Documentation**
- **[README.md](README.md)**: Complete documentation
- **[API Documentation](http://localhost:8000/docs)**: API integration
- **[GitHub Issues](https://github.com/Clarence161095/Premium-Vietnamese-Text-to-Speech-Application/issues)**: Bug reports and suggestions

### **🚀 Advanced Usage**
- **Batch Processing**: Process multiple files
- **Custom Models**: Train your own models
- **Production Deployment**: Deploy to servers

### **🤝 Community**
- **Facebook Group**: Vietnamese TTS Developers
- **Discord**: Premium Vietnamese TTS Community
- **Stack Overflow**: Tag [vietnamese-tts]

---

## 🎉 **Congratulations!**

You've successfully set up the **Premium Vietnamese Text-to-Speech Application**! 

🎵 Start creating amazing Vietnamese voices right now!

---

<div align="center">

**⭐ If this guide was helpful, please star the project! ⭐**

[🏠 Back to Home](README.md) • [🐛 Report Issues](https://github.com/Clarence161095/Premium-Vietnamese-Text-to-Speech-Application/issues) • [💡 Discussions](https://github.com/Clarence161095/Premium-Vietnamese-Text-to-Speech-Application/discussions)

</div>
