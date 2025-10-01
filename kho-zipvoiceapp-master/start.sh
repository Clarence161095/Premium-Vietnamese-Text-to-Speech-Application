#!/bin/bash

# Script để chạy ZipVoice TTS App với Docker

echo "🚀 Khởi động ZipVoice TTS Application"
echo "=================================="

# Kiểm tra Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt. Vui lòng cài Docker trước khi chạy."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose chưa được cài đặt. Vui lòng cài Docker Compose trước khi chạy."
    exit 1
fi

# Tạo các thư mục cần thiết nếu chưa có
echo "📁 Tạo các thư mục cần thiết..."
mkdir -p voices
mkdir -p src/zipvoice/exp
mkdir -p src/zipvoice/prompts
mkdir -p public/soundeffect

# Kiểm tra model files
if [ ! -d "src/zipvoice/exp" ] || [ -z "$(ls -A src/zipvoice/exp)" ]; then
    echo "⚠️  Thư mục model (src/zipvoice/exp) trống hoặc không tồn tại."
    echo "   Vui lòng đặt các file model ZipVoice vào thư mục này trước khi chạy."
fi

# Build và chạy container
echo "🔨 Building Docker image..."
docker-compose build

echo "🚀 Khởi động ứng dụng..."
docker-compose up -d

echo ""
echo "✅ Ứng dụng đã được khởi động!"
echo "🌐 Truy cập: http://localhost:3000"
echo "📊 Kiểm tra logs: docker-compose logs -f"
echo "🛑 Dừng ứng dụng: docker-compose down"
echo ""

# Hiển thị status
echo "📋 Container status:"
docker-compose ps
