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

    // Quality Presets
    qualityPresets: "Preset chất lượng",
    fast: "Nhanh",
    balanced: "Trung bình",
    high: "Cao",
    premium: "Cao nhất",
    fastDesc: "Tạo nhanh (~6-8s)",
    balancedDesc: "Cân bằng chất lượng/tốc độ (~8-12s)",
    highDesc: "Chất lượng cao (~12-16s)",
    premiumDesc: "Chất lượng tối đa (~15-20s)",

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

    // Quality Presets
    qualityPresets: "Quality Presets",
    fast: "Fast",
    balanced: "Balanced",
    high: "High",
    premium: "Premium",
    fastDesc: "Quick generation (~6-8s)",
    balancedDesc: "Balanced quality/speed (~8-12s)",
    highDesc: "High quality (~12-16s)",
    premiumDesc: "Maximum quality (~15-20s)",

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

const VoiceProfileCard = ({ profileId, profile, isSelected, onSelect, onEdit, onDelete, t }) => (
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
          <h3 className="text-white font-semibold text-lg">{profile.name}</h3>
          <p className="text-white/70 text-sm">{profile.description}</p>
        </div>
      </div>
      {isSelected && (
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
    </div>
    <div className="text-xs text-white/50">
      <i className="fas fa-clock mr-1"></i>
      {profile.created_at || 'Recently created'}
    </div>
  </div>
);

const QualityPresets = ({ onPresetSelect, currentSettings, t }) => {
  const presets = [
    {
      name: t.fast,
      icon: 'fas fa-bolt',
      description: t.fastDesc,
      settings: { guidance_scale: 0.9, num_step: 8, speed: 1.0 },
      tooltip: t.tooltips.fastPreset,
      variant: 'fast'
    },
    {
      name: t.balanced,
      icon: 'fas fa-balance-scale',
      description: t.balancedDesc,
      settings: { guidance_scale: 1.0, num_step: 16, speed: 1.0 },
      tooltip: t.tooltips.balancedPreset,
      variant: 'balanced'
    },
    {
      name: t.high,
      icon: 'fas fa-star',
      description: t.highDesc,
      settings: { guidance_scale: 1.1, num_step: 22, speed: 1.0 },
      tooltip: t.tooltips.highPreset,
      variant: 'high'
    },
    {
      name: t.premium,
      icon: 'fas fa-crown',
      description: t.premiumDesc,
      settings: { guidance_scale: 1.2, num_step: 28, speed: 1.0 },
      tooltip: t.tooltips.premiumPreset,
      variant: 'premium'
    }
  ];

  return (
    <div className="preset-grid animate-fade-in-up">
      {presets.map((preset, index) => (
        <Tooltip key={preset.name} content={preset.tooltip}>
          <button
            onClick={() => onPresetSelect(preset.settings)}
            className={`preset-card preset-${preset.variant}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="preset-icon">
              <i className={preset.icon}></i>
            </div>
            <h3 className="preset-title">{preset.name}</h3>
            <p className="preset-description">{preset.description}</p>
          </button>
        </Tooltip>
      ))}
    </div>
  );
};

const AdvancedControls = ({ settings, onChange, isExpanded, onToggle, t }) => (
  <div className="card mb-6 animate-fade-in-up">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between text-white font-semibold text-lg mb-4"
    >
      <span className="flex items-center">
        <i className="fas fa-sliders-h mr-3"></i>
        {t.advancedSettings}
      </span>
      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} transition-transform duration-300`}></i>
    </button>

    {isExpanded && (
      <div className="space-y-6 animate-slide-in-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Tooltip content={t.tooltips.guidanceScale}>
              <label className="block text-white font-medium mb-3">
                <i className="fas fa-magic mr-2"></i>
                {t.guidanceScale}: {settings.guidance_scale}
              </label>
            </Tooltip>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.guidance_scale}
              onChange={(e) => onChange('guidance_scale', parseFloat(e.target.value))}
              className="range-slider"
            />
            <div className="flex justify-between text-white/60 text-xs mt-1">
              <span>{t.low}</span>
              <span>{t.high}</span>
            </div>
          </div>

          <div>
            <Tooltip content={t.tooltips.generationSteps}>
              <label className="block text-white font-medium mb-3">
                <i className="fas fa-step-forward mr-2"></i>
                {t.generationSteps}: {settings.num_step}
              </label>
            </Tooltip>
            <input
              type="range"
              min="8"
              max="32"
              step="2"
              value={settings.num_step}
              onChange={(e) => onChange('num_step', parseInt(e.target.value))}
              className="range-slider"
            />
            <div className="flex justify-between text-white/60 text-xs mt-1">
              <span>{t.fast}</span>
              <span>{t.quality}</span>
            </div>
          </div>

          <div>
            <Tooltip content={t.tooltips.speed}>
              <label className="block text-white font-medium mb-3">
                <i className="fas fa-tachometer-alt mr-2"></i>
                {t.speed}: {settings.speed}x
              </label>
            </Tooltip>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.speed}
              onChange={(e) => onChange('speed', parseFloat(e.target.value))}
              className="range-slider"
            />
            <div className="flex justify-between text-white/60 text-xs mt-1">
              <span>{t.slow}</span>
              <span>{t.fast}</span>
            </div>
          </div>

          <div>
            <Tooltip content={t.tooltips.gpuUsage}>
              <label className="block text-white font-medium mb-3">
                <i className="fas fa-microchip mr-2"></i>
                {t.gpuUsage}: {Math.round(settings.gpu_offload * 100)}%
              </label>
            </Tooltip>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={settings.gpu_offload}
              onChange={(e) => onChange('gpu_offload', parseFloat(e.target.value))}
              className="range-slider"
            />
            <div className="flex justify-between text-white/60 text-xs mt-1">
              <span>{t.economy}</span>
              <span>{t.maximum}</span>
            </div>
          </div>
        </div>

        <div>
          <Tooltip content={t.tooltips.tokenLimit}>
            <label className="block text-white font-medium mb-3">
              <i className="fas fa-align-left mr-2"></i>
              {t.tokenLimit}: {settings.context_length.toLocaleString()}
            </label>
          </Tooltip>
          <input
            type="number"
            min="65000"
            max="130000"
            step="1000"
            value={settings.context_length}
            onChange={(e) => onChange('context_length', parseInt(e.target.value))}
            className="form-input"
            placeholder="Maximum 130,000 tokens"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Tooltip content={t.tooltips.featureScale}>
              <label className="block text-white font-medium mb-3">
                <i className="fas fa-wave-square mr-2"></i>
                {t.featureScale}: {settings.feat_scale}
              </label>
            </Tooltip>
            <input
              type="range"
              min="0.05"
              max="0.3"
              step="0.05"
              value={settings.feat_scale}
              onChange={(e) => onChange('feat_scale', parseFloat(e.target.value))}
              className="range-slider"
            />
          </div>

          <div>
            <Tooltip content={t.tooltips.targetRMS}>
              <label className="block text-white font-medium mb-3">
                <i className="fas fa-volume-up mr-2"></i>
                {t.targetRMS}: {settings.target_rms}
              </label>
            </Tooltip>
            <input
              type="range"
              min="0.05"
              max="0.3"
              step="0.05"
              value={settings.target_rms}
              onChange={(e) => onChange('target_rms', parseFloat(e.target.value))}
              className="range-slider"
            />
          </div>
        </div>
      </div>
    )}
  </div>
);

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

  // TODO: Persist advanced settings state
  // useEffect(() => {
  //   if (showAdvanced !== null) {
  //     localStorage.setItem('showAdvanced', JSON.stringify(showAdvanced || true));
  //   }
  // }, [showAdvanced]);

  // State management
  const [text, setText] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(() => {
    const stored = localStorage.getItem('showAdvanced');
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastGenerationTime, setLastGenerationTime] = useState(null);

  // Audio settings
  const [settings, setSettings] = useState({
    speed: 1.0,
    guidance_scale: 1.0,
    num_step: 16,
    feat_scale: 0.1,
    target_rms: 0.1,
    context_length: 10000,
    gpu_offload: 0.9
  });

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

  // Load profiles on component mount
  useEffect(() => {
    loadProfiles();
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

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePresetSelect = (presetSettings) => {
    setSettings(prev => ({ ...prev, ...presetSettings }));
    showNotification('success', t.presetApplied);
  };

  const estimateProcessingTime = () => {
    const wordCount = text.split(' ').filter(w => w.length > 0).length;
    const baseTime = Math.max(6, wordCount * 0.3); // Base time calculation
    const qualityMultiplier = settings.num_step / 16; // Adjust based on steps
    const speedMultiplier = 1 / settings.speed; // Adjust based on speed
    return Math.round(baseTime * qualityMultiplier * speedMultiplier);
  };

  const getQualityLevel = () => {
    if (settings.guidance_scale >= 1.2) return language === 'vi' ? 'Cao nhất' : 'Premium';
    if (settings.guidance_scale >= 1.1) return language === 'vi' ? 'Cao' : 'High';
    if (settings.guidance_scale >= 1.0) return language === 'vi' ? 'Trung bình' : 'Balanced';
    return language === 'vi' ? 'Nhanh' : 'Fast';
  };

  const getProcessingMode = () => {
    const wordCount = text.split(' ').filter(w => w.length > 0).length;
    if (wordCount <= 20) return language === 'vi' ? 'Xử lý nhanh' : 'Fast processing';
    return language === 'vi' ? 'Xử lý batch' : 'Batch processing';
  };

  const handleSynthesize = async () => {
    if (!text.trim()) {
      showNotification('error', t.pleaseEnterText);
      return;
    }

    setLoading(true);
    setAudio(null);
    const startTime = Date.now();

    try {
      const formData = new FormData();
      if (selectedProfile) formData.append('profile_id', selectedProfile);
      formData.append('text', text);

      Object.entries(settings).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch('http://localhost:8000/synthesize_speech', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudio(audioUrl);
      setLastGenerationTime(Math.round((Date.now() - startTime) / 1000));
      showNotification('success', t.speechGenerated);
    } catch (error) {
      showNotification('error', `${t.error}: ${error.message}`);
    } finally {
      setLoading(false);
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

        {/* Quality Presets */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-black mb-6 flex items-center animate-slide-in-left">
            <i className="fas fa-palette mr-3"></i>
            {t.qualityPresets}
          </h2>
          <QualityPresets
            onPresetSelect={handlePresetSelect}
            currentSettings={settings}
            t={t}
          />
        </section>

        {/* Main Content */}
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
                maxLength={settings.context_length}
              />

              <div className="flex justify-between items-center text-white/60 text-sm mb-4">
                <span>
                  {text.length.toLocaleString()} {t.characters}
                  <span className="text-white/40 ml-1">
                    (~{Math.ceil(text.length * 7.5).toLocaleString()} tokens)
                  </span>
                </span>
                <span>
                  {text.split(' ').filter(w => w.length > 0).length} {t.words} /
                  <span className="text-white/40 ml-1">
                    {settings.context_length.toLocaleString()} tokens max
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

            {/* Advanced Controls */}
            <AdvancedControls
              settings={settings}
              onChange={handleSettingChange}
              isExpanded={showAdvanced}
              onToggle={() => setShowAdvanced(!showAdvanced)}
              t={t}
            />
          </div>

          {/* Right Column - Voice Profiles & Statistics */}
          <div className="space-y-6">
            {/* Default Voice Option */}
            <div className="card animate-slide-in-right">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <i className="fas fa-user-circle mr-3"></i>
                {t.voiceSelection}
              </h2>

              <button
                onClick={() => setSelectedProfile('')}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-300 mb-4 ${!selectedProfile
                    ? 'border-green-400 bg-green-400/10'
                    : 'border-white/20 hover:border-white/40'
                  }`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center mr-3">
                    <i className="fas fa-star text-white"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold">
                      {!selectedProfile ? t.usingDefaultVoice : t.useDefaultVoice}
                    </div>
                    <div className="text-white/60 text-sm">{t.recommendedVoice}</div>
                  </div>
                </div>
              </button>

              {/* Profile List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
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
              <button
                onClick={() => setShowAddProfile(true)}
                className="btn-outline w-full mt-4"
              >
                <i className="fas fa-plus mr-2"></i>
                {t.addNewProfile}
              </button>
            </div>

            {/* Enhanced Statistics */}
            <div className="card animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
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
                  <span>{t.qualityLevel}:</span>
                  <span className="font-semibold">{getQualityLevel()}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>{t.gpu}:</span>
                  <span className="font-semibold">{Math.round(settings.gpu_offload * 100)}%</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>{t.estimatedTime}:</span>
                  <span className="font-semibold">~{estimateProcessingTime()}s</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>{t.processingMode}:</span>
                  <span className="font-semibold">{getProcessingMode()}</span>
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
  );
}

export default App;
