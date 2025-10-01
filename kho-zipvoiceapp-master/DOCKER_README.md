# Docker Setup cho ZipVoice TTS Application

## Yêu cầu hệ thống
- Docker & Docker Compose
- ít nhất 4GB RAM available cho container

## Cách chạy

### 1. Chuẩn bị model files
Đặt các file model ZipVoice vào thư mục `src/zipvoice/exp/`:
```
src/zipvoice/exp/
├── iter-525000-avg-2.pt  (hoặc model khác)
├── tokens.txt
└── README.md
```

### 2. Chạy ứng dụng
```bash
# Cách 1: Sử dụng script
chmod +x start.sh
./start.sh

# Cách 2: Chạy trực tiếp
docker-compose up -d
```

### 3. Truy cập ứng dụng
- Mở trình duyệt: http://localhost:3000

## Cấu trúc thư mục

```
├── src/zipvoice/exp/      # Model files (mount từ host)
├── voices/                # Voice profiles (mount từ host) 
├── public/soundeffect/    # Sound effect files (mount từ host)
├── uploads/               # Temporary uploads (Docker volume)
└── output/                # Temporary outputs (Docker volume)
```

## Các lệnh hữu ích

```bash
# Xem logs
docker-compose logs -f

# Restart container
docker-compose restart

# Dừng ứng dụng
docker-compose down

# Xóa hoàn toàn (bao gồm volumes)
docker-compose down -v

# Build lại image
docker-compose build --no-cache
```

## Cấu hình môi trường

Container sử dụng các biến môi trường:
- `NODE_ENV=production`
- `PYTHONPATH=/app/src/zipvoice` 
- `PYTHON_PATH=/usr/bin/python3`

## Troubleshooting

### Container không khởi động được
1. Kiểm tra Docker daemon: `docker ps`
2. Xem logs: `docker-compose logs`
3. Kiểm tra port 3000 có bị chiếm: `netstat -an | grep 3000`

### Model không tìm thấy
1. Đảm bảo file model có trong `src/zipvoice/exp/`
2. Restart container: `docker-compose restart`

### Lỗi Python dependencies
1. Build lại image: `docker-compose build --no-cache`
2. Kiểm tra requirements.txt trong src/zipvoice/
