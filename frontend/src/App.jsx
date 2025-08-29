import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// === LANGUAGE SYSTEM === //

const translations = {
  vi: {
    // Header
    title: "Premium Vietnamese TTS",
    subtitle: "Tạo giọng nói tiếng Việt chất lượng cao với công nghệ AI hiện đại",

    // Theme & Language
    darkMode: "Chế độ tối",
    lightMode: "Chế độ sáng",
    language: "Ngôn ngữ",

    // GPU & System Monitoring
    gpuStatus: "Trạng thái GPU",
    gpuTemperature: "Nhiệt độ GPU",
    gpuUtilization: "Sử dụng GPU",
    vramUsage: "Sử dụng VRAM",
    emergencyStop: "Dừng khẩn cấp",
    renderStatus: "Trạng thái xử lý",

    // Text Input
    textInput: "Nhập văn bản",
    textPlaceholder: "Nhập văn bản tiếng Việt của bạn tại đây...",
    exampleTexts: "Ví dụ văn bản:",
    characters: "ký tự",
    words: "từ",

    // Voice Selection
    voiceSelection: "Giọng nói",
    defaultVoice: "Giọng mặc định",
    usingDefaultVoice: "✓ Đang sử dụng giọng mặc định",
    useDefaultVoice: "Sử dụng giọng mặc định",
    recommendedVoice: "Giọng Tina (Khuyến nghị)",
    addNewProfile: "Thêm profile mới",

    // Generation
    generateSpeech: "Tạo giọng nói",
    generating: "Đang tạo giọng nói...",
    result: "Kết quả",
    download: "Tải xuống",
    
    // Recent Renders
    recentRenders: "Lịch sử tạo giọng",
    noRecentRenders: "Chưa có lịch sử tạo giọng nào trong 8 giờ qua",
    loadingHistory: "Đang tải lịch sử...",
    page: "Trang",
    records: "bản ghi",
    createdAt: "Tạo lúc",
    duration: "Thời lượng",
    fileSize: "Kích thước",
    play: "Phát",
    downloading: "Đang tải...",

    // Advanced Settings
    advancedSettings: "Cài đặt nâng cao",
    guidanceScale: "Guidance Scale",
    generationSteps: "Bước sinh",
    speed: "Tốc độ",
    gpuUsage: "Sử dụng GPU",
    tokenLimit: "Giới hạn token",
    featureScale: "Feature Scale",
    targetRMS: "Target RMS",
    low: "Thấp",
    high: "Cao",
    slow: "Chậm",
    economy: "Tiết kiệm",
    maximum: "Tối đa",
    quality: "Chất lượng",

    // Statistics
    statistics: "Thống kê",
    profiles: "Profiles",
    qualityLevel: "Chất lượng",
    gpu: "GPU",
    estimatedTime: "Thời gian ước tính",
    processingMode: "Chế độ xử lý",

    // Profile Management
    createProfile: "Tạo profile giọng nói mới",
    profileName: "Tên profile",
    displayName: "Tên hiển thị",
    description: "Mô tả",
    sampleTranscript: "Transcript mẫu",
    audioSample: "File audio mẫu",
    createButton: "Tạo profile",
    cancel: "Hủy",

    // Notifications
    success: "Thành công",
    error: "Lỗi",
    profileCreated: "Tạo profile thành công!",
    speechGenerated: "Tạo giọng nói thành công!",
    presetApplied: "Đã áp dụng preset chất lượng",
    profileDeleted: "Đã xóa profile thành công",
    cannotLoadProfiles: "Không thể tải danh sách profile",
    pleaseEnterText: "Vui lòng nhập văn bản cần tạo giọng",
    pleaseCompleteForm: "Vui lòng điền đầy đủ thông tin",
    confirmDelete: "Bạn có chắc muốn xóa profile này?",

    // Tooltips
    tooltips: {
      guidanceScale: "Điều khiển độ chính xác của mô hình. Giá trị cao hơn tạo ra âm thanh chất lượng hơn nhưng chậm hơn.",
      generationSteps: "Số bước tính toán. Nhiều bước hơn = chất lượng cao hơn nhưng chậm hơn.",
      speed: "Tốc độ phát âm. 1.0 = bình thường, <1.0 = chậm, >1.0 = nhanh.",
      gpuUsage: "Phần trăm GPU được sử dụng. Cao hơn = nhanh hơn nhưng tiêu thụ điện nhiều hơn.",
      tokenLimit: "Giới hạn số lượng token (từ) có thể xử lý trong một lần.",
      featureScale: "Điều chỉnh các đặc trưng âm thanh. Ảnh hưởng đến tông điệu và cảm xúc.",
      targetRMS: "Mức âm lượng mục tiêu. Điều chỉnh độ to của âm thanh đầu ra.",
      fastPreset: "Tạo nhanh với chất lượng tốt. Phù hợp cho demo và thử nghiệm.",
      balancedPreset: "Cân bằng tốt nhất giữa chất lượng và tốc độ. Khuyến nghị cho sử dụng hàng ngày.",
      highPreset: "Chất lượng cao với thời gian xử lý vừa phải. Tốt cho thuyết trình.",
      premiumPreset: "Chất lượng tối đa cho sản xuất chuyên nghiệp. Thời gian xử lý lâu nhất."
    }
  },

  en: {
    // Header
    title: "Premium Vietnamese TTS",
    subtitle: "Generate high-quality Vietnamese speech with advanced AI technology",

    // Theme & Language
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    language: "Language",

    // GPU & System Monitoring
    gpuStatus: "GPU Status",
    gpuTemperature: "GPU Temperature",
    gpuUtilization: "GPU Utilization",
    vramUsage: "VRAM Usage",
    emergencyStop: "Emergency Stop",
    renderStatus: "Render Status",

    // Text Input
    textInput: "Text Input",
    textPlaceholder: "Enter your Vietnamese text here...",
    exampleTexts: "Example texts:",
    characters: "characters",
    words: "words",

    // Voice Selection
    voiceSelection: "Voice Selection",
    defaultVoice: "Default Voice",
    usingDefaultVoice: "✓ Using default voice",
    useDefaultVoice: "Use default voice",
    recommendedVoice: "Tina Voice (Recommended)",
    addNewProfile: "Add new profile",

    // Generation
    generateSpeech: "Generate Speech",
    generating: "Generating speech...",
    result: "Result",
    download: "Download",
    
    // Recent Renders
    recentRenders: "Recent Renders",
    noRecentRenders: "No recent renders in the last 8 hours",
    loadingHistory: "Loading history...",
    page: "Page",
    records: "records",
    createdAt: "Created at",
    duration: "Duration",
    fileSize: "File Size",
    play: "Play",
    downloading: "Downloading...",

    // Advanced Settings
    advancedSettings: "Advanced Settings",
    guidanceScale: "Guidance Scale",
    generationSteps: "Generation Steps",
    speed: "Speed",
    gpuUsage: "GPU Usage",
    tokenLimit: "Token Limit",
    featureScale: "Feature Scale",
    targetRMS: "Target RMS",
    low: "Low",
    high: "High",
    slow: "Slow",
    economy: "Economy",
    maximum: "Maximum",
    quality: "Quality",

    // Statistics
    statistics: "Statistics",
    profiles: "Profiles",
    qualityLevel: "Quality",
    gpu: "GPU",
    estimatedTime: "Estimated time",
    processingMode: "Processing mode",

    // Profile Management
    createProfile: "Create new voice profile",
    profileName: "Profile name",
    displayName: "Display name",
    description: "Description",
    sampleTranscript: "Sample transcript",
    audioSample: "Audio sample file",
    createButton: "Create profile",
    cancel: "Cancel",

    // Notifications
    success: "Success",
    error: "Error",
    profileCreated: "Profile created successfully!",
    speechGenerated: "Speech generated successfully!",
    presetApplied: "Quality preset applied",
    profileDeleted: "Profile deleted successfully",
    cannotLoadProfiles: "Cannot load profile list",
    pleaseEnterText: "Please enter text to generate speech",
    pleaseCompleteForm: "Please complete all required fields",
    confirmDelete: "Are you sure you want to delete this profile?",

    // Tooltips
    tooltips: {
      guidanceScale: "Controls model accuracy. Higher values produce better quality but slower generation.",
      generationSteps: "Number of computation steps. More steps = higher quality but slower processing.",
      speed: "Speech playback speed. 1.0 = normal, <1.0 = slower, >1.0 = faster.",
      gpuUsage: "Percentage of GPU used. Higher = faster but more power consumption.",
      tokenLimit: "Maximum number of tokens (words) that can be processed at once.",
      featureScale: "Adjusts audio features. Affects tone and emotion in the speech.",
      targetRMS: "Target volume level. Controls the loudness of the output audio.",
      fastPreset: "Quick generation with good quality. Suitable for demos and testing.",
      balancedPreset: "Best balance between quality and speed. Recommended for daily use.",
      highPreset: "High quality with moderate processing time. Good for presentations.",
      premiumPreset: "Maximum quality for professional production. Longest processing time."
    }
  }
};

// === UTILITY COMPONENTS === //

const LoadingSpinner = ({ size = 'default' }) => (
  <div className={`spinner ${size === 'small' ? 'spinner-small' : ''}`}></div>
);

const AudioVisualizer = ({ isPlaying }) => (
  <div className={`audio-visualizer ${isPlaying ? 'animate-pulse-gentle' : ''}`}>
    {[...Array(12)].map((_, i) => (
      <div key={i} className="audio-bar"></div>
    ))}
  </div>
);

const Notification = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification notification-${type}`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white/80 hover:text-white">
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Tooltip component using Tippy.js
const Tooltip = ({ content, children, position = 'top' }) => {
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (tooltipRef.current && window.tippy) {
      const instance = window.tippy(tooltipRef.current, {
        content: content,
        placement: position,
        theme: 'light-border',
        delay: [300, 100],
        duration: [200, 150],
        animation: 'scale',
        arrow: true,
        hideOnClick: false,
        touch: ['hold', 500],
      });

      return () => {
        if (instance) {
          instance.destroy();
        }
      };
    }
  }, [content, position]);

  return (
    <span ref={tooltipRef}>
      {children}
    </span>
  );
};

const LanguageToggle = ({ currentLang, onLanguageChange }) => (
  <div className="language-toggle">
    <button
      className={currentLang === 'vi' ? 'active' : ''}
      onClick={() => onLanguageChange('vi')}
    >
      VI
    </button>
    <button
      className={currentLang === 'en' ? 'active' : ''}
      onClick={() => onLanguageChange('en')}
    >
      EN
    </button>
  </div>
);

const ThemeToggle = ({ currentTheme, onThemeChange, t }) => (
  <div className="theme-toggle">
    <button
      className={currentTheme === 'dark' ? 'active' : ''}
      onClick={() => onThemeChange('dark')}
      title={t.darkMode}
    >
      <i className="fas fa-moon"></i>
    </button>
    <button
      className={currentTheme === 'light' ? 'active' : ''}
      onClick={() => onThemeChange('light')}
      title={t.lightMode}
    >
      <i className="fas fa-sun"></i>
    </button>
  </div>
);

// === MAIN COMPONENTS === //

const VoiceProfileCard = ({ profileId, profile, isSelected, onSelect, onEdit, onDelete, t }) => {
  // Check if this is a default profile (tina or NSUT-Phu-Thang)
  const isDefaultProfile = profileId === 'tina' || profileId === 'NSUT-Phu-Thang';
  
  return (
    <div
      className={`card-profile ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(profileId)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center mr-3 animate-float">
            <i className="fas fa-microphone text-white text-lg"></i>
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">
              {profile.name}
              {isDefaultProfile && (
                <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                  Mặc định
                </span>
              )}
            </h3>
            <p className="text-white/70 text-sm">{profile.description}</p>
          </div>
        </div>
        {isSelected && !isDefaultProfile && (
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(profileId);
              }}
              className="text-white/70 hover:text-white transition-colors"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(profileId);
              }}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        )}
        {isSelected && isDefaultProfile && (
          <div className="flex items-center space-x-2">
            <span className="text-white/40 text-xs">
              Không thể chỉnh sửa
            </span>
          </div>
        )}
      </div>
      <div className="text-xs text-white/50">
        <i className="fas fa-clock mr-1"></i>
        {profile.created_at || 'Recently created'}
      </div>
    </div>
  );
};

const GPUMonitor = ({ t }) => {
  const [gpuStatus, setGpuStatus] = useState({
    temperature: 0,
    utilization: 0,
    memory_used: 0,
    memory_total: 0,
    status: "UNKNOWN"
  });
  const [renderStatus, setRenderStatus] = useState({
    is_rendering: false,
    current_sentence: 0,
    total_sentences: 0,
    estimated_time_remaining: 0,
    elapsed_time: 0
  });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Get GPU status
        const gpuResponse = await fetch('http://localhost:8000/gpu_status');
        if (gpuResponse.ok) {
          const gpuData = await gpuResponse.json();
          setGpuStatus(gpuData);
        }

        // Get render status
        const renderResponse = await fetch('http://localhost:8000/render_status');
        if (renderResponse.ok) {
          const renderData = await renderResponse.json();
          setRenderStatus(renderData);
        }
      } catch (error) {
        console.warn('Failed to fetch monitoring data:', error);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleEmergencyStop = async () => {
    try {
      await fetch('http://localhost:8000/stop_render', { method: 'POST' });
      showNotification('success', 'Rendering stopped successfully');
    } catch (error) {
      showNotification('error', 'Failed to stop rendering');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NORMAL': return 'text-green-400';
      case 'THROTTLE': return 'text-yellow-400';
      case 'EMERGENCY': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="card animate-slide-in-right">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center">
        <i className="fas fa-tachometer-alt mr-3"></i>
        {t.gpuStatus}
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between text-white/80">
          <span>{t.gpuTemperature}:</span>
          <span className={`font-semibold ${getStatusColor(gpuStatus.status)}`}>
            {gpuStatus.temperature.toFixed(1)}°C
          </span>
        </div>
        
        <div className="flex justify-between text-white/80">
          <span>{t.gpuUtilization}:</span>
          <span className="font-semibold">{gpuStatus.utilization.toFixed(1)}%</span>
        </div>
        
        <div className="flex justify-between text-white/80">
          <span>{t.vramUsage}:</span>
          <span className="font-semibold">
            {(gpuStatus.memory_used / 1024).toFixed(1)}GB / {(gpuStatus.memory_total / 1024).toFixed(1)}GB
          </span>
        </div>

        {renderStatus.is_rendering && (
          <div className="mt-4 p-3 bg-blue-500/20 rounded-lg">
            <div className="flex justify-between text-white/80 mb-2">
              <span>Progress:</span>
              <span>{renderStatus.current_sentence}/{renderStatus.total_sentences}</span>
            </div>
            <div className="flex justify-between text-white/80 mb-2">
              <span>Remaining:</span>
              <span>{Math.round(renderStatus.estimated_time_remaining)}s</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(renderStatus.current_sentence / renderStatus.total_sentences) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {(renderStatus.is_rendering || gpuStatus.status === 'EMERGENCY') && (
          <button
            onClick={handleEmergencyStop}
            className="btn-danger w-full mt-4"
          >
            <i className="fas fa-stop mr-2"></i>
            {t.emergencyStop}
          </button>
        )}
      </div>
    </div>
  );
};

const RenderStatusMonitor = ({ t, onEmergencyStop }) => {
  const [renderStatus, setRenderStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRenderStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/render_status');
        const data = await response.json();
        setRenderStatus(data);
      } catch (error) {
        console.error('Failed to fetch render status:', error);
      }
    };

    // Poll render status every 2 seconds during processing
    const interval = setInterval(fetchRenderStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleEmergencyStop = async () => {
    setLoading(true);
    try {
      await fetch('http://localhost:8000/stop_render', { method: 'POST' });
      onEmergencyStop();
    } catch (error) {
      console.error('Failed to stop render:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-fade-in-up">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center">
        <i className="fas fa-cogs mr-3"></i>
        {t.renderStatus}
      </h3>
      
      {renderStatus && (
        <div className="space-y-3">
          <div className="flex justify-between text-white/80">
            <span>Status:</span>
            <span className={`font-semibold ${
              renderStatus.is_processing ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {renderStatus.is_processing ? 'Processing...' : 'Ready'}
            </span>
          </div>
          
          {renderStatus.current_sentence && (
            <div className="text-white/60 text-sm">
              <div>Sentence: {renderStatus.current_sentence}/{renderStatus.total_sentences}</div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(renderStatus.current_sentence / renderStatus.total_sentences) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {renderStatus.estimated_time_remaining && (
            <div className="text-white/60 text-sm">
              Estimated time: {renderStatus.estimated_time_remaining}s
            </div>
          )}
        </div>
      )}
      
      {renderStatus?.is_processing && (
        <button
          onClick={handleEmergencyStop}
          disabled={loading}
          className="btn-danger w-full mt-4"
        >
          <i className="fas fa-stop mr-2"></i>
          {loading ? 'Stopping...' : t.emergencyStop}
        </button>
      )}
    </div>
  );
};

const RecentRenders = ({ t, recentRenders, loading, pagination, onPageChange, onPlayRender }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async (record) => {
    try {
      const response = await fetch(`http://localhost:8000/render_file/${record.id}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `render_${record.id}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="card animate-slide-in-left">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center">
        <i className="fas fa-history mr-3"></i>
        {t.recentRenders}
      </h3>
      
      {loading ? (
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="text-white/70 mt-2">{t.loadingHistory}</p>
        </div>
      ) : recentRenders.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          <i className="fas fa-clock text-2xl mb-2"></i>
          <p>{t.noRecentRenders}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {recentRenders.map((record) => (
              <div key={record.id} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {record.full_text_preview}
                    </p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-white/60">
                      <span>
                        <i className="fas fa-user mr-1"></i>
                        {record.profile_id}
                      </span>
                      <span>
                        <i className="fas fa-clock mr-1"></i>
                        {formatDateTime(record.timestamp)}
                      </span>
                      <span>
                        <i className="fas fa-text-width mr-1"></i>
                        {record.word_count} từ
                      </span>
                      <span>
                        <i className="fas fa-file mr-1"></i>
                        {formatFileSize(record.file_size)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    <button
                      onClick={() => onPlayRender(record)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title={t.play}
                    >
                      <i className="fas fa-play"></i>
                    </button>
                    <button
                      onClick={() => handleDownload(record)}
                      className="text-green-400 hover:text-green-300 transition-colors"
                      title={t.download}
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>
                {t.page} {pagination.page} / {pagination.total_pages} 
                ({pagination.total_records} {t.records})
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.has_prev}
                  className="px-3 py-1 bg-white/10 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.has_next}
                  className="px-3 py-1 bg-white/10 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// === MAIN APP === //

function App() {
  // Language state
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'vi';
  });

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const t = translations[language];

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // State management
  const [text, setText] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastGenerationTime, setLastGenerationTime] = useState(null);
  
  // Recent renders state
  const [recentRenders, setRecentRenders] = useState([]);
  const [rendersLoading, setRendersLoading] = useState(false);
  const [rendersPagination, setRendersPagination] = useState({
    page: 1,
    per_page: 10,
    total_records: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false
  });
  
  // Rendering status monitoring
  const [isCurrentlyRendering, setIsCurrentlyRendering] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    display_name: '',
    description: '',
    sample_text: '',
    sample_wav: null
  });

  const audioRef = useRef(null);

  // Example texts for both languages
  const exampleTexts = {
    vi: [
      "Xin chào, tôi là trợ lý ảo của bạn. Tôi có thể giúp bạn tạo ra giọng nói tiếng Việt tự nhiên và chất lượng cao.",
      "Việt Nam là đất nước có nền văn hóa lâu đời và phong phú. Từ vịnh Hạ Long kỳ vĩ đến phố cổ Hội An thơ mộng.",
      "Hôm nay trời đẹp quá, chúng ta cùng nhau khám phá những điều tuyệt vời trong cuộc sống này nhé!",
      "Công nghệ trí tuệ nhân tạo đang phát triển mạnh mẽ, mang lại nhiều tiện ích cho cuộc sống con người.",
      "Âm nhạc là ngôn ngữ của tâm hồn, kết nối mọi người lại với nhau qua những giai điệu du dương.",
      "Giáo dục là chìa khóa mở ra tương lai, giúp chúng ta phát triển bản thân và đóng góp cho xã hội.",
      "Gia đình là nơi yêu thương và hạnh phúc nhất, luôn ủng hộ chúng ta trong mọi hoàn cảnh của cuộc đời.",
      "Thiên nhiên tuyệt đẹp với núi non trùng điệp, rừng xanh bát ngát và biển cả mênh mông bao la.",
      "Thể thao không chỉ rèn luyện sức khỏe mà còn giúp chúng ta có tinh thần lạc quan và ý chí mạnh mẽ.",
      "Khoa học và kỹ thuật đang thay đổi thế giới, mở ra những cơ hội mới cho sự phát triển bền vững."
    ],
    en: [
      "Hello, I am your virtual assistant. I can help you create natural and high-quality Vietnamese speech.",
      "Vietnam is a country with a long and rich cultural heritage. From the magnificent Ha Long Bay to the poetic ancient town of Hoi An.",
      "What a beautiful day today! Let's explore the wonderful things in life together!",
      "Artificial intelligence technology is developing rapidly, bringing many conveniences to human life.",
      "Music is the language of the soul, connecting people through melodious tunes.",
      "Education is the key to the future, helping us develop ourselves and contribute to society.",
      "Family is the most loving and happy place, always supporting us in all circumstances of life.",
      "Nature is beautiful with majestic mountains, vast green forests and boundless seas.",
      "Sports not only strengthen health but also help us have an optimistic spirit and strong will.",
      "Science and technology are changing the world, opening new opportunities for sustainable development."
    ]
  };

  // Random example text rotation
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExampleIndex(prev => (prev + 1) % exampleTexts[language].length);
    }, 5000);

    return () => clearInterval(interval);
  }, [language, exampleTexts]);

  // Language change handler
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Load profiles and recent renders on component mount
  useEffect(() => {
    loadProfiles();
    loadRecentRenders();
  }, []);

  // Audio event listeners
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        audio.removeEventListener('play', () => setIsPlaying(true));
        audio.removeEventListener('pause', () => setIsPlaying(false));
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, [audio]);

  const loadProfiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/profiles');
      const data = await response.json();
      setProfiles(data);
    } catch (error) {
      showNotification('error', t.cannotLoadProfiles);
    }
  };

  const loadRecentRenders = async (page = 1) => {
    try {
      setRendersLoading(true);
      const response = await fetch(`http://localhost:8000/recent_renders?page=${page}&per_page=10`);
      const data = await response.json();
      setRecentRenders(data.data || []);
      setRendersPagination(data.pagination || {
        page: 1,
        per_page: 10,
        total_records: 0,
        total_pages: 1,
        has_next: false,
        has_prev: false
      });
    } catch (error) {
      console.error('Failed to load recent renders:', error);
      setRecentRenders([]);
    } finally {
      setRendersLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const estimateProcessingTime = () => {
    const wordCount = text.split(' ').filter(w => w.length > 0).length;
    const baseTime = Math.max(2, wordCount * 0.5); // Base time for sentence-by-sentence processing
    return Math.round(baseTime);
  };

  const handleEmergencyStop = () => {
    setLoading(false);
    setAudio(null);
    showNotification('success', 'Processing stopped successfully');
  };

  const handleSynthesize = async () => {
    if (!text.trim()) {
      showNotification('error', t.pleaseEnterText);
      return;
    }

    setLoading(true);
    setIsCurrentlyRendering(true);  // Track rendering state
    setAudio(null);
    const startTime = Date.now();

    try {
      const formData = new FormData();
      if (selectedProfile) formData.append('profile_id', selectedProfile);
      formData.append('text', text);

      console.log('Sending request with:', {
        profile_id: selectedProfile || 'default',
        text_length: text.length,
        text_preview: text.substring(0, 50) + '...'
      });

      const response = await fetch('http://localhost:8000/synthesize_speech', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudio(audioUrl);
      setLastGenerationTime(Math.round((Date.now() - startTime) / 1000));
      showNotification('success', t.speechGenerated);
      
      // Reload recent renders after successful synthesis
      await loadRecentRenders();
      
    } catch (error) {
      showNotification('error', `${t.error}: ${error.message}`);
    } finally {
      setLoading(false);
      setIsCurrentlyRendering(false);  // Reset rendering state
    }
  };

  const handleAddProfile = async (e) => {
    e.preventDefault();

    if (!profileForm.name || !profileForm.display_name || !profileForm.sample_text || !profileForm.sample_wav) {
      showNotification('error', t.pleaseCompleteForm);
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(profileForm).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const response = await fetch('http://localhost:8000/profiles', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Cannot create profile');
      }

      showNotification('success', t.profileCreated);
      setShowAddProfile(false);
      setProfileForm({
        name: '',
        display_name: '',
        description: '',
        sample_text: '',
        sample_wav: null
      });
      loadProfiles();
    } catch (error) {
      showNotification('error', error.message);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!confirm(t.confirmDelete)) return;

    try {
      const response = await fetch(`http://localhost:8000/profiles/${profileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Cannot delete profile');
      }

      showNotification('success', t.profileDeleted);
      if (selectedProfile === profileId) {
        setSelectedProfile('');
      }
      loadProfiles();
    } catch (error) {
      showNotification('error', error.message);
    }
  };

  const handlePlayRender = async (record) => {
    try {
      // Set current audio to the render file
      const response = await fetch(`http://localhost:8000/render_file/${record.id}`);
      if (!response.ok) throw new Error('Failed to load audio');
      
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      setAudio(audioUrl);
    } catch (error) {
      showNotification('error', `Failed to play audio: ${error.message}`);
    }
  };

  const handlePageChange = (page) => {
    loadRecentRenders(page);
  };

  const downloadAudio = () => {
    if (audio) {
      const a = document.createElement('a');
      a.href = audio;
      a.download = `vietnamese_speech_${Date.now()}.wav`;
      a.click();
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      {/* Theme Toggle - Bottom Right */}
      <div className="theme-toggle-left">
        <ThemeToggle
          currentTheme={theme}
          onThemeChange={setTheme}
          t={t}
        />
      </div>

      {/* Language Toggle - Top Left */}
      <div className="language-toggle-right">
        <LanguageToggle
          currentLang={language}
          onLanguageChange={handleLanguageChange}
        />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800-title mb-4 animate-float">
            {t.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
          <div className="mt-6 flex justify-center">
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-shimmer"></div>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Voice Profile Management - Central Position */}
          <div className="max-w-4xl mx-auto">
            <div className="card animate-fade-in-up">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-center">
                <i className="fas fa-user-circle mr-3"></i>
                {t.voiceSelection}
              </h2>

              {/* Default Voice Option */}
              <div className="mb-4">
                <button
                  onClick={() => setSelectedProfile('')}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-300 ${!selectedProfile
                      ? 'border-green-400 bg-green-400/10'
                      : 'border-white/20 hover:border-white/40'
                    }`}
                >
                  <div className="flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center mr-3">
                      <i className="fas fa-star text-white"></i>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-semibold">
                        {!selectedProfile ? t.usingDefaultVoice : t.useDefaultVoice}
                      </div>
                      <div className="text-white/60 text-sm">{t.recommendedVoice}</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Profile List - Horizontal Layout with Scroll for 3+ Profiles */}
              <div className={`${Object.keys(profiles).length > 3 ? 'max-h-64 overflow-y-auto' : ''} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4`}>
                {Object.entries(profiles).map(([profileId, profile]) => (
                  <VoiceProfileCard
                    key={profileId}
                    profileId={profileId}
                    profile={profile}
                    isSelected={selectedProfile === profileId}
                    onSelect={setSelectedProfile}
                    onEdit={() => { }}
                    onDelete={handleDeleteProfile}
                    t={t}
                  />
                ))}
              </div>

              {/* Add Profile Button */}
              <div className="text-center">
                <button
                  onClick={() => setShowAddProfile(true)}
                  className="btn-outline px-8"
                >
                  <i className="fas fa-plus mr-2"></i>
                  {t.addNewProfile}
                </button>
              </div>
            </div>
          </div>

          {/* Content Grid - Text Input and Monitoring */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Text Input & Controls */}
            <div className="lg:col-span-2 space-y-6">
            {/* Text Input */}
            <div className="card animate-fade-in-up">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <i className="fas fa-edit mr-3"></i>
                {t.textInput}
              </h2>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t.textPlaceholder}
                className="form-textarea h-40 mb-4"
              />

              <div className="flex justify-between items-center text-white/60 text-sm mb-4">
                <span>
                  {text.length.toLocaleString()} {t.characters}
                </span>
                <span>
                  {text.split(' ').filter(w => w.length > 0).length} {t.words}
                  <span className="text-green-400 ml-2">
                    • Unlimited processing
                  </span>
                </span>
              </div>

              {/* Example Texts */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3 flex items-center">
                  <i className="fas fa-lightbulb mr-2"></i>
                  {t.exampleTexts}
                </h3>
                <div className="rotating-example">
                  <button
                    onClick={() => setText(exampleTexts[language][currentExampleIndex])}
                    className="text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-all duration-300 hover:transform hover:scale-105 w-full"
                  >
                    {exampleTexts[language][currentExampleIndex]}
                  </button>
                </div>
              </div>

              {/* Synthesize Button */}
              <button
                onClick={handleSynthesize}
                disabled={loading || !text.trim()}
                className="btn-primary w-full text-lg py-4 relative overflow-hidden"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="small" />
                    <span className="ml-3">{t.generating}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <i className="fas fa-microphone mr-3"></i>
                    {t.generateSpeech}
                  </div>
                )}
              </button>
            </div>

            {/* Audio Player */}
            {audio && (
              <div className="card animate-fade-in-up">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <i className="fas fa-play-circle mr-3"></i>
                  {t.result}
                </h3>

                <AudioVisualizer isPlaying={isPlaying} />

                <audio
                  ref={audioRef}
                  src={audio}
                  controls
                  className="w-full mb-4 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                />

                <button
                  onClick={downloadAudio}
                  className="btn-success w-full"
                >
                  <i className="fas fa-download mr-2"></i>
                  {t.download}
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Monitoring & Statistics */}
          <div className="space-y-6">
            {/* GPU Status Monitor */}
            <GPUMonitor t={t} />

            {/* Render Status Monitor */}
            <RenderStatusMonitor t={t} onEmergencyStop={handleEmergencyStop} />

            {/* Recent Renders History */}
            <RecentRenders 
              t={t} 
              recentRenders={recentRenders}
              loading={rendersLoading}
              pagination={rendersPagination}
              onPageChange={handlePageChange}
              onPlayRender={handlePlayRender}
            />

            {/* Enhanced Statistics */}
            <div className="card animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <i className="fas fa-chart-bar mr-3"></i>
                {t.statistics}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-white/80">
                  <span>{t.profiles}:</span>
                  <span className="font-semibold">{Object.keys(profiles).length}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Processing:</span>
                  <span className="font-semibold text-green-400">Sentence-by-sentence</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>{t.estimatedTime}:</span>
                  <span className="font-semibold">~{estimateProcessingTime()}s</span>
                </div>
                {lastGenerationTime && (
                  <div className="flex justify-between text-green-400">
                    <span>Last generation:</span>
                    <span className="font-semibold">{lastGenerationTime}s</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Profile Modal */}
        <Modal
          isOpen={showAddProfile}
          onClose={() => setShowAddProfile(false)}
          title={t.createProfile}
        >
          <form onSubmit={handleAddProfile} className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">{t.profileName}:</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                className="form-input"
                placeholder="e.g. my_voice"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">{t.displayName}:</label>
              <input
                type="text"
                value={profileForm.display_name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, display_name: e.target.value }))}
                className="form-input"
                placeholder="e.g. My Voice"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">{t.description}:</label>
              <input
                type="text"
                value={profileForm.description}
                onChange={(e) => setProfileForm(prev => ({ ...prev, description: e.target.value }))}
                className="form-input"
                placeholder="Brief voice description"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">{t.sampleTranscript}:</label>
              <textarea
                value={profileForm.sample_text}
                onChange={(e) => setProfileForm(prev => ({ ...prev, sample_text: e.target.value }))}
                className="form-textarea h-24"
                placeholder="Enter the exact text content of your audio sample..."
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">{t.audioSample}:</label>
              <input
                type="file"
                accept=".wav,.mp3,.m4a,.flac"
                onChange={(e) => setProfileForm(prev => ({ ...prev, sample_wav: e.target.files[0] }))}
                className="form-input"
                required
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button type="submit" className="btn-primary flex-1">
                <i className="fas fa-save mr-2"></i>
                {t.createButton}
              </button>
              <button
                type="button"
                onClick={() => setShowAddProfile(false)}
                className="btn-outline flex-1"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        </Modal>

        {/* Notification */}
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
        </div>
      </div>
    </div>
  );
}

export default App;
