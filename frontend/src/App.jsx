import React, { useState, useEffect } from 'react';
import './App.css';
import ClassicTTS from './ClassicTTS';

// === LANGUAGE SYSTEM === //
const translations = {
  vi: {
    title: "Premium Vietnamese TTS",
    subtitle: "Tạo giọng nói tiếng Việt chất lượng cao với công nghệ AI hiện đại",
    darkMode: "Chế độ tối",
    lightMode: "Chế độ sáng",
    backToMenu: "Quay lại menu",
    comingSoon: "Tính năng đang phát triển",
    selectMode: "Chọn chế độ TTS phù hợp với nhu cầu của bạn",
    classicTitle: "TTS Truyền Thống",
    classicDesc: "Tạo giọng nói từ toàn bộ văn bản cùng lúc. Phù hợp cho văn bản ngắn và demo nhanh.",
    segmentTitle: "TTS Theo Đoạn", 
    segmentDesc: "Chia văn bản thành các đoạn nhỏ, tạo giọng riêng lẻ. Phù hợp cho văn bản dài và chỉnh sửa chi tiết.",
    classicFeatures: [
      "Xử lý toàn bộ văn bản cùng lúc",
      "Một file audio đầu ra duy nhất", 
      "Nhanh chóng và đơn giản",
      "Lịch sử render 50 lần gần nhất"
    ],
    segmentFeatures: [
      "Chia văn bản theo độ dài tùy chỉnh",
      "Tạo và chỉnh sửa từng đoạn riêng lẻ",  
      "Cache thông minh - chỉ render đoạn thay đổi",
      "Quản lý session và lưu trữ lâu dài"
    ],
    stableStatus: "Ổn định - Đã kiểm nghiệm",
    newStatus: "Mới - Tính năng nâng cao",
    guidanceTitle: "Hướng dẫn lựa chọn",
    classicGuidance: "Phù hợp cho văn bản dưới 500 từ, cần kết quả nhanh",
    segmentGuidance: "Lý tưởng cho văn bản dài, cần chỉnh sửa chi tiết từng phần",
    
    // Segment TTS specific
    textInput: "Nhập văn bản",
    textPlaceholder: "Nhập văn bản tiếng Việt dài của bạn tại đây...",
    segmentLength: "Độ dài đoạn",
    characters: "ký tự",
    words: "từ",
    splitText: "Chia văn bản",
    segments: "đoạn",
    segment: "Đoạn",
    generateAll: "Tạo tất cả đoạn",
    generateSegment: "Tạo đoạn này",
    regenerateSegment: "Tạo lại đoạn",
    playSegment: "Phát đoạn",
    editSegment: "Chỉnh sửa",
    deleteSegment: "Xóa đoạn",
    mergeAll: "Ghép tất cả",
    downloadAll: "Tải xuống tất cả",
    sessionId: "Mã phiên",
    createSession: "Tạo phiên làm việc",
    loadSession: "Tải phiên làm việc",
    saveSession: "Lưu phiên làm việc",
    deleteSession: "Xóa phiên làm việc",
    processing: "Đang xử lý...",
    cached: "Đã cache",
    generated: "Đã tạo",
    pending: "Chờ xử lý",
    error: "Lỗi",
    voiceSelection: "Chọn giọng nói",
    defaultVoice: "Giọng mặc định",
    profile: "Profile"
  },
  en: {
    title: "Premium Vietnamese TTS",
    subtitle: "Generate high-quality Vietnamese speech with advanced AI technology",
    darkMode: "Dark Mode",
    lightMode: "Light Mode", 
    backToMenu: "Back to menu",
    comingSoon: "Feature under development",
    selectMode: "Choose the TTS mode that fits your needs",
    classicTitle: "Classic TTS",
    classicDesc: "Generate speech from entire text at once. Suitable for short texts and quick demos.",
    segmentTitle: "Segment TTS",
    segmentDesc: "Split text into small segments, generate individual speech. Suitable for long texts and detailed editing.",
    classicFeatures: [
      "Process entire text at once",
      "Single audio output file",
      "Fast and simple",
      "History of last 50 renders"
    ],
    segmentFeatures: [
      "Split text by customizable length",
      "Create and edit individual segments",
      "Smart cache - only render changed segments", 
      "Session management and long-term storage"
    ],
    stableStatus: "Stable - Tested",
    newStatus: "New - Advanced feature",
    guidanceTitle: "Selection Guide",
    classicGuidance: "Suitable for texts under 500 words, need quick results",
    segmentGuidance: "Ideal for long texts, need detailed editing of parts",
    
    // Segment TTS specific
    textInput: "Text Input",
    textPlaceholder: "Enter your long Vietnamese text here...",
    segmentLength: "Segment Length",
    characters: "characters",
    words: "words",
    splitText: "Split Text",
    segments: "segments",
    segment: "Segment",
    generateAll: "Generate All",
    generateSegment: "Generate This",
    regenerateSegment: "Regenerate",
    playSegment: "Play",
    editSegment: "Edit",
    deleteSegment: "Delete",
    mergeAll: "Merge All",
    downloadAll: "Download All",
    sessionId: "Session ID",
    createSession: "Create Session",
    loadSession: "Load Session",
    saveSession: "Save Session",
    deleteSession: "Delete Session",
    processing: "Processing...",
    cached: "Cached",
    generated: "Generated",
    pending: "Pending",
    error: "Error",
    voiceSelection: "Voice Selection",
    defaultVoice: "Default Voice",
    profile: "Profile"
  }
};

// === UTILITY COMPONENTS === //
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

// === MODE SELECTION COMPONENT === //
const ModeSelection = ({ onSelectMode, t, theme, language, onLanguageChange, onThemeChange }) => {
  const modes = [
    {
      id: 'classic',
      name: 'Classic TTS',
      title: t.classicTitle,
      description: t.classicDesc,
      features: t.classicFeatures,
      icon: 'fas fa-microphone',
      color: 'from-blue-500 to-indigo-600',
      status: t.stableStatus
    },
    {
      id: 'segment',
      name: 'Segment TTS',
      title: t.segmentTitle,
      description: t.segmentDesc,
      features: t.segmentFeatures,
      icon: 'fas fa-layer-group',
      color: 'from-green-500 to-emerald-600',
      status: t.newStatus
    }
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="theme-toggle-left">
        <ThemeToggle currentTheme={theme} onThemeChange={onThemeChange} t={t} />
      </div>
      <div className="language-toggle-right">
        <LanguageToggle currentLang={language} onLanguageChange={onLanguageChange} />
      </div>

      <div className="max-w-6xl mx-auto">
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

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            {t.selectMode}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {modes.map((mode) => (
              <div
                key={mode.id}
                className="card hover:transform hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden"
                onClick={() => onSelectMode(mode.id)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-10`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${mode.color} flex items-center justify-center mr-4 animate-float`}>
                        <i className={`${mode.icon} text-white text-2xl`}></i>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{mode.title}</h3>
                        <p className="text-white/70 text-sm">{mode.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        mode.id === 'classic' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {mode.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-white/80 mb-6 leading-relaxed">
                    {mode.description}
                  </p>

                  <div className="space-y-3 mb-6">
                    {mode.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-white/70">
                        <i className="fas fa-check-circle text-green-400 mr-3"></i>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    className={`btn-primary w-full text-lg py-4 bg-gradient-to-r ${mode.color} hover:shadow-lg transition-all duration-300`}
                    onClick={() => onSelectMode(mode.id)}
                  >
                    <i className={`${mode.icon} mr-3`}></i>
                    Chọn {mode.title}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <div className="card max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              <i className="fas fa-info-circle mr-2"></i>
              {t.guidanceTitle}
            </h3>
            <div className="text-white/80 text-left space-y-2">
              <p><strong>Classic TTS:</strong> {t.classicGuidance}</p>
              <p><strong>Segment TTS:</strong> {t.segmentGuidance}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// === SEGMENT TTS COMPONENT === //
const SegmentTTS = ({ onBack, t, theme, language, onLanguageChange, onThemeChange }) => {
  // States for segment TTS
  const [text, setText] = useState('');
  const [segmentLength, setSegmentLength] = useState(50);
  const [segments, setSegments] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [profiles, setProfiles] = useState({});
  const [sessionId, setSessionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [sessionsList, setSessionsList] = useState([]);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [showSessionsList, setShowSessionsList] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, eta: null });
  const [startTime, setStartTime] = useState(null);

  // Load profiles on component mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/profiles');
      if (response.ok) {
        const data = await response.json();
        setProfiles(data || {});
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setProfiles({});
    }
  };

  // Create segment session
  const splitTextIntoSegments = async () => {
    if (!text.trim()) {
      showNotification('Vui lòng nhập văn bản', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/create_simple_session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          segment_length: segmentLength,
          profile_id: selectedProfile || null
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSessionId(result.session_id);
        setSegments(result.segments.map(s => ({
          ...s,
          audioUrl: null
        })));
        showNotification(`Tạo session với ${result.segments_count} đoạn`, 'success');
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      showNotification('Lỗi tạo session', 'error');
    }
  };

  // Generate single segment
  const generateSegment = async (segmentId) => {
    if (!sessionId) {
      showNotification('Vui lòng tạo session trước', 'error');
      return;
    }

    // Update segment status
    setSegments(prev => prev.map(s => 
      s.id === segmentId ? { ...s, status: 'processing' } : s
    ));

    try {
      const response = await fetch(`http://localhost:8000/generate_simple_segment/${sessionId}/${segmentId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        
        // Get audio URL for playback
        const audioUrl = `/audio/${sessionId}/${segmentId}`;
        
        setSegments(prev => prev.map(s => 
          s.id === segmentId ? { 
            ...s, 
            status: 'completed',
            audio: audioUrl,
            generated_at: result.generated_at
          } : s
        ));
        
        showNotification(`Đã tạo xong đoạn ${segmentId + 1}`, 'success');
      } else {
        throw new Error('Failed to generate segment');
      }
    } catch (error) {
      console.error('Error generating segment:', error);
      setSegments(prev => prev.map(s => 
        s.id === segmentId ? { ...s, status: 'error' } : s
      ));
      showNotification(`Lỗi tạo đoạn ${segmentId + 1}`, 'error');
    }
  };

  // Generate all segments with progress tracking
  const generateAllSegments = async () => {
    if (segments.length === 0) {
      showNotification('Vui lòng chia văn bản trước', 'error');
      return;
    }

    const pendingSegments = segments.filter(s => s.status === 'pending' || s.status === 'error');
    if (pendingSegments.length === 0) {
      showNotification('Tất cả segments đã được tạo', 'success');
      return;
    }

    setIsProcessing(true);
    setStartTime(Date.now());
    setBatchProgress({ current: 0, total: pendingSegments.length, eta: null });
    
    let completed = 0;
    const segmentTimes = [];

    for (const segment of pendingSegments) {
      const segmentStart = Date.now();
      
      // Update progress
      setBatchProgress(prev => ({ ...prev, current: completed }));
      
      await generateSegment(segment.id);
      
      const segmentTime = Date.now() - segmentStart;
      segmentTimes.push(segmentTime);
      completed++;
      
      // Calculate ETA
      if (segmentTimes.length > 0) {
        const avgTime = segmentTimes.reduce((a, b) => a + b, 0) / segmentTimes.length;
        const remaining = pendingSegments.length - completed;
        const etaMs = remaining * avgTime;
        const etaMinutes = Math.ceil(etaMs / 60000);
        
        setBatchProgress(prev => ({ 
          ...prev, 
          current: completed,
          eta: etaMinutes > 0 ? `${etaMinutes} phút` : 'Gần xong'
        }));
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsProcessing(false);
    setBatchProgress({ current: 0, total: 0, eta: null });
    showNotification('Đã tạo xong tất cả đoạn', 'success');
  };

  // Play segment audio
  const playSegment = (segmentId) => {
    const segment = segments.find(s => s.id === segmentId);
    if (segment && segment.audioUrl) {
      const audio = new Audio(segment.audioUrl);
      audio.play();
    }
  };

  // Play all segments sequentially
  const playAllSegments = async () => {
    if (!sessionId) {
      showNotification('Không có session để phát', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/merge_all_segments/${sessionId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Play merged audio
          const audioUrl = `http://localhost:8000/audio/merged/${sessionId}`;
          const audio = new Audio(audioUrl);
          audio.play().then(() => {
            showNotification('Đang phát tất cả đoạn', 'success');
          }).catch(error => {
            console.error('Error playing merged audio:', error);
            showNotification('Lỗi phát audio', 'error');
          });
        }
      } else {
        throw new Error('Failed to merge segments');
      }
    } catch (error) {
      console.error('Error merging segments:', error);
      showNotification('Lỗi phát tất cả đoạn', 'error');
    }
  };

  // Merge all segments for download
  const mergeAllSegments = async () => {
    if (!sessionId) {
      showNotification('Không có session để merge', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/merge_all_segments/${sessionId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Download merged file
          const downloadUrl = `http://localhost:8000/audio/merged/${sessionId}`;
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `merged_segments_${sessionId.slice(0, 8)}.wav`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showNotification('Đã merge và tải xuống thành công', 'success');
        }
      } else {
        throw new Error('Failed to merge segments');
      }
    } catch (error) {
      console.error('Error merging segments:', error);
      showNotification('Lỗi merge segments', 'error');
    }
  };

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Load sessions list
  const loadSessionsList = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/segment/sessions');
      if (response.ok) {
        const result = await response.json();
        setSessionsList(result.sessions);
        setShowSessionsList(!showSessionsList);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      showNotification('Lỗi tải danh sách phiên', 'error');
    }
  };

  // Load existing session
  const loadExistingSession = async (sessionIdToLoad) => {
    try {
      const response = await fetch(`http://localhost:8000/api/segment/session/${sessionIdToLoad}`);
      if (response.ok) {
        const session = await response.json();
        setSessionId(sessionIdToLoad);
        setText(session.text);
        setSegmentLength(session.segment_length);
        setSelectedProfile(session.profile_id || '');
        setSegments(session.segments.map(s => ({
          ...s,
          audioUrl: s.status === 'generated' ? `http://localhost:8000/api/segment/audio/${sessionIdToLoad}/${s.id}` : null
        })));
        setShowSessionsList(false);
        showNotification('Đã tải phiên thành công', 'success');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      showNotification('Lỗi tải phiên', 'error');
    }
  };

  // Delete session
  const deleteSession = async (sessionIdToDelete) => {
    if (!confirm('Bạn có chắc muốn xóa phiên này?')) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/segment/session/${sessionIdToDelete}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setSessionsList(prev => prev.filter(s => s.session_id !== sessionIdToDelete));
        if (sessionId === sessionIdToDelete) {
          setSessionId('');
          setSegments([]);
        }
        showNotification('Đã xóa phiên thành công', 'success');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      showNotification('Lỗi xóa phiên', 'error');  
    }
  };

  // Start editing segment text
  const startEditingSegment = (segmentId) => {
    const segment = segments.find(s => s.id === segmentId);
    if (segment) {
      setEditingSegment(segmentId);
      setEditingText(segment.text);
    }
  };

  // Save edited segment text and regenerate only that segment
  const saveEditedSegment = async () => {
    if (editingSegment === null) return;

    const segment = segments.find(s => s.id === editingSegment);
    if (!segment || segment.text === editingText.trim()) {
      setEditingSegment(null);
      return;
    }

    try {
      // Update segment status to processing
      setSegments(prev => prev.map(s => 
        s.id === editingSegment ? { ...s, status: 'processing' } : s
      ));
      
      // Use Form data to send text update
      const formData = new FormData();
      formData.append('new_text', editingText.trim());
      
      const response = await fetch(`http://localhost:8000/update_segment/${sessionId}/${editingSegment}`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update segment in state
        setSegments(prev => prev.map(s => 
          s.id === editingSegment ? { 
            ...s, 
            text: result.text,
            status: result.status,
            audio: result.status === 'completed' ? `http://localhost:8000/audio/${sessionId}/${editingSegment}` : null,
            generated_at: result.generated_at || s.generated_at
          } : s
        ));
        
        setEditingSegment(null);
        setEditingText('');
        
        if (result.status === 'completed') {
          showNotification(`Đã cập nhật và tạo lại đoạn ${editingSegment + 1}`, 'success');
        } else if (result.status === 'unchanged') {
          showNotification('Nội dung không thay đổi', 'info');
        }
      } else {
        throw new Error('Failed to update segment');
      }
    } catch (error) {
      console.error('Error updating segment:', error);
      
      // Reset segment status on error
      setSegments(prev => prev.map(s => 
        s.id === editingSegment ? { ...s, status: 'error' } : s
      ));
      
      showNotification(`Lỗi cập nhật đoạn ${editingSegment + 1}`, 'error');
    }
  };

  // Cancel editing
  const cancelEditingSegment = () => {
    setEditingSegment(null);
    setEditingText('');
  };

  // Import session
  const importSession = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      const response = await fetch(`${API_BASE}/import_session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showNotification(`Session imported: ${result.total_segments} segments`, 'success');
        // Optionally load the imported session
        await loadExistingSession(result.session_id);
      } else {
        throw new Error(result.detail || 'Import failed');
      }
    } catch (error) {
      console.error('Failed to import session:', error);
      showNotification('Failed to import session', 'error');
    }
    
    // Reset file input
    event.target.value = '';
  };

  // Get segment status color
  const getSegmentStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-500';
      case 'processing': return 'bg-yellow-500 animate-pulse';
      case 'generated': return 'bg-green-500';
      case 'cached': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <button onClick={onBack} className="btn-outline px-4 py-2">
          <i className="fas fa-arrow-left mr-2"></i>
          {t.backToMenu}
        </button>
      </div>

      {/* Theme & Language Toggles */}
      <div className="theme-toggle-left">
        <ThemeToggle currentTheme={theme} onThemeChange={onThemeChange} t={t} />
      </div>
      <div className="language-toggle-right">
        <LanguageToggle currentLang={language} onLanguageChange={onLanguageChange} />
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-lg text-white ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800-title mb-4">
            {t.segmentTitle}
          </h1>
          <p className="text-lg text-gray-600">
            {t.segmentDesc}
          </p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4">
                <i className="fas fa-cog mr-2"></i>
                Cấu hình
              </h3>

              {/* Voice Selection - Copied from ClassicTTS */}
              <div className="mb-6">
                <label className="block text-white/80 mb-3 font-semibold">
                  <i className="fas fa-user-circle mr-2"></i>
                  {t.voiceSelection}
                </label>
                
                {/* Default Voice Option */}
                <div className="mb-3">
                  <button
                    onClick={() => setSelectedProfile('')}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-300 ${!selectedProfile
                        ? 'border-green-400 bg-green-400/10'
                        : 'border-white/20 hover:border-white/40'
                      }`}
                  >
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center mr-3">
                        <i className="fas fa-star text-white text-sm"></i>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-semibold text-sm">
                          {!selectedProfile ? '✓ Đang sử dụng giọng mặc định' : 'Sử dụng giọng mặc định'}
                        </div>
                        <div className="text-white/60 text-xs">Giọng nữ chuẩn tiếng Việt</div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Profile List */}
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {Object.entries(profiles).map(([profileId, profile]) => (
                    <button
                      key={profileId}
                      onClick={() => setSelectedProfile(profileId)}
                      className={`p-3 rounded-lg border-2 transition-all duration-300 text-left ${
                        selectedProfile === profileId
                          ? 'border-green-400 bg-green-400/10'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center mr-3">
                          <i className="fas fa-microphone text-white text-sm"></i>
                        </div>
                        <div>
                          <div className="text-white font-semibold text-sm">
                            {selectedProfile === profileId ? '✓ ' : ''}{profile.display_name || profileId}
                          </div>
                          <div className="text-white/60 text-xs truncate">
                            {profile.description || 'Voice profile'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Segment Length */}
              <div className="mb-4">
                <label className="block text-white/80 mb-2">
                  {t.segmentLength}: {segmentLength} {t.characters}
                </label>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={segmentLength}
                  onChange={(e) => setSegmentLength(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-white/60 mt-1">
                  <span>20</span>
                  <span>200</span>
                </div>
              </div>

              {/* Session List Dropdown */}
              {showSessionsList && sessionsList.length > 0 && (
                <div className="bg-white/5 border border-white/20 rounded-lg p-2 max-h-40 overflow-y-auto">
                  <div className="text-white/60 text-xs mb-2">Các phiên gần đây:</div>
                  {sessionsList.map((session) => (
                    <div key={session.session_id} 
                         className="flex justify-between items-center p-2 hover:bg-white/5 rounded cursor-pointer"
                         onClick={() => loadExistingSession(session.session_id)}>
                      <div className="flex-1">
                        <div className="text-white text-sm truncate">{session.text_preview}</div>
                        <div className="text-white/40 text-xs">
                          {session.completion_rate} • {new Date(session.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {e.stopPropagation(); deleteSession(session.session_id);}}
                        className="text-red-400 hover:text-red-300 ml-2"
                        title="Xóa phiên"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Advanced Settings */}
              <div className="border-t border-white/10 pt-4">
                <details className="mb-3">
                  <summary className="text-white/80 cursor-pointer hover:text-white">
                    <i className="fas fa-cog mr-2"></i>Advanced Settings
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-white/60 text-sm block mb-1">Segment Length</label>
                      <select 
                        value={segmentLength} 
                        onChange={(e) => setSegmentLength(parseInt(e.target.value))}
                        className="w-full bg-white/5 border border-white/20 rounded px-2 py-1 text-white text-sm"
                      >
                        <option value={30}>30 seconds</option>
                        <option value={60}>60 seconds</option>
                        <option value={90}>90 seconds</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center text-white/80">
                        <input 
                          type="checkbox" 
                          checked={autoGenerate} 
                          onChange={(e) => setAutoGenerate(e.target.checked)}
                          className="mr-2"
                        />
                        Auto-generate segments
                      </label>
                    </div>
                  </div>
                </details>
              </div>



              {/* Statistics */}
              <div className="text-white/60 text-sm">
                <p>Văn bản: {text.length} {t.characters}</p>
                <p>Đoạn: {segments.length}</p>
                <p>Đã tạo: {segments.filter(s => s.status === 'generated').length}</p>
              </div>
            </div>
          </div>

          {/* Right Panel - Main Workspace */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Input */}
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4">
                <i className="fas fa-edit mr-2"></i>
                {t.textInput}
              </h3>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t.textPlaceholder}
                className="w-full h-32 px-3 py-2 bg-white border border-gray-300 rounded-lg text-black resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-white/60 text-sm">
                  {text.length} {t.characters}
                </span>
                <button
                  onClick={splitTextIntoSegments}
                  className="btn-primary"
                  disabled={!text.trim()}
                >
                  <i className="fas fa-cut mr-2"></i>
                  {t.splitText}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {isProcessing && batchProgress.total > 0 && (
              <div className="card mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-bold text-white">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Đang xử lý batch
                  </h4>
                  <div className="text-white/70 text-sm">
                    {batchProgress.current}/{batchProgress.total}
                    {batchProgress.eta && ` • ETA: ${batchProgress.eta}`}
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  ></div>
                </div>
                <div className="text-white/60 text-xs">
                  {Math.round((batchProgress.current / batchProgress.total) * 100)}% hoàn thành
                </div>
              </div>
            )}

            {/* Segments List */}
            {segments.length > 0 && (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">
                    <i className="fas fa-list mr-2"></i>
                    {segments.length} {t.segments}
                  </h3>
                  <button
                    onClick={generateAllSegments}
                    disabled={isProcessing}
                    className="btn-primary mr-2"
                  >
                    <i className="fas fa-play-circle mr-2"></i>
                    {isProcessing ? t.processing : t.generateAll}
                  </button>
                  
                  {segments.some(s => s.status === 'completed') && (
                    <button
                      onClick={playAllSegments}
                      className="btn-outline mr-2 bg-green-500/20 text-green-300 hover:bg-green-500/30"
                    >
                      <i className="fas fa-volume-up mr-2"></i>
                      Phát tất cả
                    </button>
                  )}
                  
                  {segments.some(s => s.status === 'generated') && (
                    <button
                      onClick={mergeAllSegments}
                      className="btn-outline"
                    >
                      <i className="fas fa-compress-arrows-alt mr-2"></i>
                      {t.mergeAll}
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {segments.map((segment) => (
                    <div key={segment.id} className="border border-white/20 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <span className="text-white font-medium mr-3">
                            {t.segment} {segment.id + 1}
                          </span>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs text-white ${getSegmentStatusColor(segment.status)}`}>
                              {t[segment.status] || segment.status}
                            </span>
                            {segment.status === 'generated' && (
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300">
                                <i className="fas fa-database mr-1"></i>Cached
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {/* Audio Player for each segment */}
                          {segment.status === 'completed' && segment.audio && (
                            <audio 
                              controls 
                              className="w-48 h-8"
                              src={`http://localhost:8000${segment.audio}`}
                              style={{ transform: 'scale(0.8)' }}
                            >
                              Your browser does not support audio.
                            </audio>
                          )}
                          {segment.status === 'generated' && (
                            <button
                              onClick={() => playSegment(segment.id)}
                              className="text-green-400 hover:text-green-300"
                              title={t.playSegment}
                            >
                              <i className="fas fa-play"></i>
                            </button>
                          )}
                          <button
                            onClick={() => startEditingSegment(segment.id)}
                            className="text-yellow-400 hover:text-yellow-300"
                            title={t.editSegment}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => generateSegment(segment.id)}
                            disabled={segment.status === 'processing'}
                            className="text-blue-400 hover:text-blue-300"
                            title={segment.status === 'generated' ? t.regenerateSegment : t.generateSegment}
                          >
                            <i className="fas fa-sync-alt"></i>
                          </button>
                          {segment.status === 'generated' && (
                            <button
                              onClick={() => clearSegmentCache(segment.id)}
                              className="text-orange-400 hover:text-orange-300"
                              title="Clear Cache"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Text Display/Edit */}
                      {editingSegment === segment.id ? (
                        <div className="mb-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="segment-input resize-none"
                            rows="3"
                            placeholder="Nhập nội dung segment..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                saveEditedSegment();
                              }
                              if (e.key === 'Escape') {
                                cancelEditingSegment();
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex space-x-2 mt-1">
                            <button
                              onClick={saveEditedSegment}
                              className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs"
                            >
                              <i className="fas fa-check mr-1"></i>Lưu
                            </button>
                            <button
                              onClick={cancelEditingSegment}
                              className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs"
                            >
                              <i className="fas fa-times mr-1"></i>Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-white/70 text-sm mb-2 cursor-pointer hover:text-white/90"
                           onClick={() => startEditingSegment(segment.id)}
                           title="Click để chỉnh sửa">
                          {segment.text}
                        </p>
                      )}
                      
                      {/* Audio Player */}
                      {segment.status === 'completed' && segment.audio && (
                        <div className="mt-3 p-2 bg-white/5 rounded-lg">
                          <audio 
                            controls 
                            className="w-full"
                            style={{ height: '32px' }}
                          >
                            <source src={`http://localhost:8000${segment.audio}`} type="audio/wav" />
                            Trình duyệt không hỗ trợ audio player
                          </audio>
                        </div>
                      )}
                      
                      {segment.generated_at && (
                        <p className="text-white/40 text-xs mt-2">
                          Tạo lúc: {new Date(segment.generated_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// === MAIN APP === //
function App() {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'vi';
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const [currentMode, setCurrentMode] = useState(null);

  const t = translations[language];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const handleSelectMode = (mode) => {
    setCurrentMode(mode);
  };

  const handleBackToModeSelection = () => {
    setCurrentMode(null);
  };

  if (currentMode === 'classic') {
    return (
      <ClassicTTS
        onBack={handleBackToModeSelection}
        t={t}
        theme={theme}
        language={language}
        onLanguageChange={handleLanguageChange}
        onThemeChange={setTheme}
      />
    );
  }

  if (currentMode === 'segment') {
    return (
      <SegmentTTS
        onBack={handleBackToModeSelection}
        t={t}
        theme={theme}
        language={language}
        onLanguageChange={handleLanguageChange}
        onThemeChange={setTheme}
      />
    );
  }

  return (
    <ModeSelection
      onSelectMode={handleSelectMode}
      t={t}
      theme={theme}
      language={language}
      onLanguageChange={handleLanguageChange}
      onThemeChange={setTheme}
    />
  );
}

export default App;
