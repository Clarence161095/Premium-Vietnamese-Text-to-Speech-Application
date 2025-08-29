# Backend Dockerfile for FastAPI + ZipVoice (GPU)
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y git ffmpeg python3 python3-pip python3-venv && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY ../ZipVoice/requirements.txt ./requirements.txt
COPY ../ZipVoice/requirements_eval.txt ./requirements_eval.txt

# Install Python dependencies (PyTorch with CUDA, FastAPI, Uvicorn, etc.)
RUN pip3 install --upgrade pip && \
    pip3 install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu121 && \
    pip3 install fastapi uvicorn[standard] pydantic python-multipart && \
    pip3 install soundfile numpy glob2 && \
    pip3 install -r requirements.txt && \
    pip3 install -r requirements_eval.txt

# Copy backend source code
COPY . /app

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
