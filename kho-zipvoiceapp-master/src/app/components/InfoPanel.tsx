'use client';

import { useState } from 'react';

export default function InfoPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 text-gray-800 dark:text-gray-100">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Hướng dẫn sử dụng
        </h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isOpen ? 'Ẩn' : 'Hiện'}
        </button>
      </div>
      
      {isOpen && (
        <div className="mt-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">
              1. Upload Prompt Audio File
            </h3>
            <p>
              Chọn file âm thanh mẫu (.wav, .mp3, .m4a) có giọng nói mà bạn muốn mô phỏng. 
              File này sẽ được sử dụng làm mẫu để tạo giọng nói mới.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">
              2. Prompt Text
            </h3>
            <p>
              Nhập chính xác nội dung của file âm thanh mẫu. Đây là văn bản tương ứng với 
              những gì được nói trong file âm thanh.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">
              3. Text to Convert
            </h3>
            <p>
              Nhập văn bản mà bạn muốn chuyển thành giọng nói. Giọng nói được tạo sẽ 
              có âm điệu và đặc điểm tương tự như file mẫu.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">
              4. Advanced Settings
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Model Directory:</strong> Đường dẫn đến thư mục chứa model ZipVoice</li>
              <li><strong>Checkpoint Name:</strong> Tên file checkpoint của model</li>
              <li><strong>Tokenizer:</strong> Loại tokenizer sử dụng (espeak cho tiếng Việt)</li>
              <li><strong>Language:</strong> Mã ngôn ngữ (vi cho tiếng Việt)</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              💡 Mẹo sử dụng
            </h4>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>File âm thanh mẫu nên có chất lượng tốt và giọng nói rõ ràng</li>
              <li>Prompt text phải chính xác với nội dung trong file âm thanh</li>
              <li>Văn bản cần chuyển nên có độ dài phù hợp (không quá dài)</li>
              <li>Đảm bảo ZipVoice model đã được cài đặt và cấu hình đúng</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
