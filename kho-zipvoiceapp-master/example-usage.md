# Ví dụ sử dụng ZipVoice Web App

## Chuẩn bị

1. Đảm bảo ZipVoice đã được cài đặt và hoạt động
2. Có file âm thanh mẫu (.wav) với giọng nói rõ ràng
3. Biết chính xác nội dung của file âm thanh mẫu

## Ví dụ cụ thể

### Input:
- **Prompt Audio File**: `begai10t.wav` (file âm thanh mẫu)
- **Prompt Text**: "Mỗi người trong chúng ta đều mang theo những ước mơ thầm kín. Dù hành trình phía trước đầy khó khăn, chỉ cần không bỏ cuộc, ta sẽ đến được nơi mình mong muốn."
- **Text to Convert**: "Mỗi người trong chúng ta đều mang theo những ước mơ thầm kín. Dù hành trình phía trước đầy khó khăn, chỉ cần không bỏ cuộc, ta sẽ đến được nơi mình mong muốn."

### Advanced Settings:
- **Model Directory**: `D:/zipvoiceapp/src/zipvoice/exp`
- **Checkpoint Name**: `iter-96000-avg-2.pt`
- **Tokenizer**: `espeak`
- **Language**: `vi`

### Output:
- File âm thanh được tạo: `begai2.wav`

## Các bước thực hiện:

1. Mở ứng dụng web tại `http://localhost:3000`
2. Click vào vùng upload để chọn file `begai10t.wav`
3. Nhập prompt text vào ô "Prompt Text"
4. Nhập text cần chuyển vào ô "Text to Convert"
5. Kiểm tra các advanced settings
6. Click "Tạo Giọng Nói"
7. Đợi quá trình xử lý hoàn tất
8. Nghe kết quả và tải xuống file âm thanh

## Lưu ý:

- Quá trình tạo giọng nói có thể mất vài phút tùy thuộc vào độ dài văn bản
- Đảm bảo file âm thanh mẫu có chất lượng tốt
- Prompt text phải chính xác với nội dung trong file âm thanh
- Model directory và checkpoint phải tồn tại và đúng đường dẫn
