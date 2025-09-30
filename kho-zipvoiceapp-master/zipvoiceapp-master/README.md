# ZipVoice Text-to-Speech Web Application

Ứng dụng web để chuyển đổi văn bản thành giọng nói sử dụng ZipVoice.

## Tính năng

- Upload file âm thanh mẫu (prompt audio)
- Nhập nội dung của file âm thanh mẫu (prompt text)
- Nhập văn bản cần chuyển thành giọng nói
- Tùy chỉnh các tham số model (model directory, checkpoint, tokenizer, language)
- Phát và tải xuống file âm thanh được tạo

## Yêu cầu hệ thống

- Node.js 18+ 
- Python với ZipVoice đã được cài đặt
- Conda environment với ZipVoice

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd zipvoiceapp
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Đảm bảo ZipVoice đã được cài đặt và hoạt động:
```bash
# Kiểm tra ZipVoice
python -m zipvoice.bin.infer_zipvoice --help
```

## Cấu hình

Trong file `src/app/api/tts/route.ts`, bạn có thể thay đổi:

- `pythonPath`: Đường dẫn đến Python executable trong conda environment
- `modelDir`: Thư mục chứa model mặc định
- `checkpointName`: Tên checkpoint mặc định

## Chạy ứng dụng

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để sử dụng ứng dụng.

## Sử dụng

1. **Upload Prompt Audio**: Chọn file âm thanh mẫu (.wav, .mp3, .m4a)
2. **Prompt Text**: Nhập nội dung của file âm thanh mẫu
3. **Text to Convert**: Nhập văn bản cần chuyển thành giọng nói
4. **Advanced Settings**: Tùy chỉnh các tham số model nếu cần
5. **Tạo Giọng Nói**: Nhấn nút để bắt đầu quá trình tạo giọng nói
6. **Phát và Tải xuống**: Nghe kết quả và tải xuống file âm thanh

### Lưu và tái sử dụng giọng

- Lưu giọng hiện tại: chọn prompt audio + prompt text, bấm "Lưu giọng hiện tại" và đặt tên.
- Chọn giọng đã lưu: dùng dropdown "Chọn giọng đã lưu". Khi chọn, có thể bỏ trống Prompt Text.
- API:
  - `GET /api/voices` trả về `{ voices: { name, promptText, promptWav, createdAt }[] }`
  - `POST /api/voices` với `multipart/form-data` gồm `name`, `promptWav`, `promptText`

## Cấu trúc thư mục

```
src/
├── app/
│   ├── api/tts/route.ts    # API endpoint cho TTS
│   ├── page.tsx           # Giao diện chính
│   └── layout.tsx         # Layout chính
├── zipvoice/              # ZipVoice source code
uploads/                   # Thư mục chứa file upload tạm thời
output/                    # Thư mục chứa file output tạm thời
```

## Lưu ý

- File upload và output sẽ được tự động xóa sau khi xử lý
- Đảm bảo ZipVoice model đã được train và có sẵn tại đường dẫn được chỉ định
- Ứng dụng hỗ trợ dark mode tự động
