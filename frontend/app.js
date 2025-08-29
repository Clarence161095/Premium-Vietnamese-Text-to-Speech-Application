import React, { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [profile, setProfile] = useState("NSUT-Phu-Thang");
  const [inputFiles, setInputFiles] = useState({});
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [config, setConfig] = useState({ context_length: 65000, temperature: 0.7, top_p: 0.9 });

  const handleFileChange = (e) => {
    setInputFiles({ ...inputFiles, [e.target.name]: e.target.files[0] });
  };

  const handleTTS = async () => {
    setProgress(10);
    const formData = new FormData();
    formData.append("text", text);
    formData.append("profile", profile);
    formData.append("context_length", config.context_length);
    formData.append("temperature", config.temperature);
    formData.append("top_p", config.top_p);
    setProgress(30);
    const res = await fetch("http://localhost:8000/tts", {
      method: "POST",
      body: formData,
    });
    setProgress(80);
    const blob = await res.blob();
    setAudioUrl(URL.createObjectURL(blob));
    setProgress(100);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-purple-700">Vietnamese TTS (ZipVoice)</h1>
      <textarea
        className="w-full p-2 border rounded mb-4"
        rows={3}
        placeholder="Nhập văn bản..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Chọn profile:</label>
        <select value={profile} onChange={e => setProfile(e.target.value)} className="border rounded p-2 w-full">
          <option value="NSUT-Phu-Thang">NSUT-Phu-Thang</option>
          <option value="tina">tina</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Cấu hình:</label>
        <div className="flex gap-2">
          <input type="number" min={1000} max={65000} value={config.context_length} onChange={e => setConfig({ ...config, context_length: e.target.value })} className="border rounded p-1 w-1/3" placeholder="Context length" />
          <input type="number" step={0.01} min={0} max={2} value={config.temperature} onChange={e => setConfig({ ...config, temperature: e.target.value })} className="border rounded p-1 w-1/3" placeholder="Temperature" />
          <input type="number" step={0.01} min={0} max={1} value={config.top_p} onChange={e => setConfig({ ...config, top_p: e.target.value })} className="border rounded p-1 w-1/3" placeholder="Top-p" />
        </div>
      </div>
      <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" onClick={handleTTS}>Chuyển đổi</button>
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-purple-500 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="block text-right text-xs mt-1">{progress}%</span>
      </div>
      {audioUrl && (
        <div className="mt-4">
          <audio controls src={audioUrl} className="w-full" />
          <a href={audioUrl} download="result.wav" className="block mt-2 text-blue-600 underline">Tải xuống kết quả</a>
        </div>
      )}
    </div>
  );
}

export default App;
