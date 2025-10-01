'use client';

import { useState, useRef, useEffect } from 'react';
import { normalizeInputText, splitIntoBatchesByNewline, type CustomMapping } from './lib/normalize';
import InfoPanel from './components/InfoPanel';

export default function Home() {
  const [voiceName, setVoiceName] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  // Batch and normalization state
  const [mappings, setMappings] = useState<CustomMapping[]>([]);
  type DictEntry = { from: string; to: string };
  type Dictionary = { id: string; name: string; entries: DictEntry[] };
  const [dictionaries, setDictionaries] = useState<Dictionary[]>([]);
  const [selectedDictIds, setSelectedDictIds] = useState<string[]>([]);
  const [showDictEditor, setShowDictEditor] = useState(false);
  const [editingDict, setEditingDict] = useState<Dictionary | null>(null);
  const [expandedDictId, setExpandedDictId] = useState<string | null>(null);
  const dictImportRef = useRef<HTMLInputElement | null>(null);
  // Sound effect dictionaries (word -> audio filename under /soundeffect)
  type SoundEntry = { from: string; file: string };
  type SoundDictionary = { id: string; name: string; entries: SoundEntry[] };
  const [sfxDictionaries, setSfxDictionaries] = useState<SoundDictionary[]>([]);
  const [selectedSfxDictIds, setSelectedSfxDictIds] = useState<string[]>([]);
  const [expandedSfxDictId, setExpandedSfxDictId] = useState<string | null>(null);
  const [showSfxEditor, setShowSfxEditor] = useState(false);
  const [editingSfxDict, setEditingSfxDict] = useState<SoundDictionary | null>(null);
  const sfxImportRef = useRef<HTMLInputElement | null>(null);
  const [batchSize, setBatchSize] = useState(4);
  const [progress, setProgress] = useState<{ total: number; done: number }>({ total: 0, done: 0 });
  const [chunks, setChunks] = useState<{ id: string; text: string; status: 'pending'|'processing'|'done'|'error'; audioUrl?: string; error?: string }[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [finalMergedUrl, setFinalMergedUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState('output_merged.wav');
  const [isMerging, setIsMerging] = useState(false);
  const [saveToServer, setSaveToServer] = useState(true);
  const [savedServerPath, setSavedServerPath] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const pauseRef = useRef(false);
  useEffect(() => { pauseRef.current = isPaused; }, [isPaused]);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const runIdRef = useRef(0);
  const [modelDir, setModelDir] = useState('/app/src/zipvoice/exp');
  const [checkpointName, setCheckpointName] = useState('iter-96000-avg-2.pt');
  const [tokenizer, setTokenizer] = useState('espeak');
  const [lang, setLang] = useState('vi');
  const [checkpoints, setCheckpoints] = useState<string[]>([]);
  const [isLoadingCkpt, setIsLoadingCkpt] = useState(false);
  const [savedVoices, setSavedVoices] = useState<{ name: string; promptText: string; promptWav: string }[]>([]);
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  // persist dictionaries in localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('zipvoice.dictionaries');
      if (raw) {
        const parsed = JSON.parse(raw) as Dictionary[];
        setDictionaries(parsed);
        // keep selection empty by default; user can choose multiple
      }
      const rawSfx = localStorage.getItem('zipvoice.sfxdicts');
      if (rawSfx) setSfxDictionaries(JSON.parse(rawSfx) as SoundDictionary[]);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('zipvoice.dictionaries', JSON.stringify(dictionaries)); } catch {}
  }, [dictionaries]);
  useEffect(() => {
    try { localStorage.setItem('zipvoice.sfxdicts', JSON.stringify(sfxDictionaries)); } catch {}
  }, [sfxDictionaries]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Modal thêm giọng mới
  const [showAddVoice, setShowAddVoice] = useState(false);
  const [newVoiceName, setNewVoiceName] = useState('');
  const [newPromptWav, setNewPromptWav] = useState<File | null>(null);
  const [newPromptText, setNewPromptText] = useState('');
  const addVoiceFileRef = useRef<HTMLInputElement>(null);

  // Modal sửa giọng
  const [showEditVoice, setShowEditVoice] = useState(false);
  const [editOriginalName, setEditOriginalName] = useState('');
  const [editName, setEditName] = useState('');
  const [editPromptText, setEditPromptText] = useState('');
  const [editPromptWav, setEditPromptWav] = useState<File | null>(null);
  const editVoiceFileRef = useRef<HTMLInputElement>(null);

  const handleAddVoiceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setNewPromptWav(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFinalMergedUrl(null);
    if (!voiceName || !text) {
      setError('Vui lòng chọn giọng đã lưu và nhập văn bản');
      return;
    }

    const myRun = ++runIdRef.current;
    setIsLoading(true);
    setIsPaused(false);
    setError('');
    setAudioUrl(null);
    setChunks([]);
    setProgress({ total: 0, done: 0 });

    try {
      // free-form mappings removed from UI
      const freeFormMappings: CustomMapping[] = [];
      // selected dictionary mappings
      const dictMappings: CustomMapping[] = dictionaries
        .filter((d) => selectedDictIds.includes(d.id))
        .flatMap((d) => d.entries.filter(e => e.from).map((e) => ({ from: e.from, to: e.to })));
      const parsedMappings: CustomMapping[] = [...dictMappings, ...freeFormMappings];
      setMappings(parsedMappings);

      // normalize and split
      const normalized = normalizeInputText(text, parsedMappings);
      const groups = splitIntoBatchesByNewline(normalized, Math.min(10, Math.max(1, batchSize)));
      const initial = groups.map((g, i) => ({ id: `c${i}`, text: g, status: 'pending' as const }));
      setChunks(initial);
      setSelectedIdx(initial.length > 0 ? 0 : -1);
      setProgress({ total: initial.length, done: 0 });

      // Build sound effect map (from -> audio file)
      const sfxMap = new Map<string, string>();
      sfxDictionaries.filter(d => selectedSfxDictIds.includes(d.id)).forEach(d => {
        d.entries.forEach(en => { if (en.from && en.file) sfxMap.set(en.from.trim().toLowerCase(), en.file.trim()); });
      });

      // sequential or small-parallel execution to avoid CPU/GPU contention
      const results: { idx: number; ok: boolean; blob?: Blob; error?: string }[] = [];
      for (let i = 0; i < initial.length; i++) {
        // Abort if a new run started (e.g., user pressed Reset)
        if (runIdRef.current !== myRun) break;
        // Wait here if paused
        while (pauseRef.current) {
          if (runIdRef.current !== myRun) break;
          await new Promise((r) => setTimeout(r, 200));
        }
        if (runIdRef.current !== myRun) break;
        // Skip logic: rely on local tracking instead of stale React state
        // Mark processing state early to avoid pending UI lag
        setChunks((prev) => prev.map((c, idx) => idx === i ? { ...c, status: 'processing' } : c));

        // If there are sound-effect tokens inside the chunk, split around them and stitch
        const chunkText = initial[i].text;
        const sfxKeys = Array.from(sfxMap.keys()).filter(k => k.length > 0).sort((a, b) => b.length - a.length);
        let segments: Array<{ type: 'text' | 'sfx'; value: string }> = [];
        if (sfxKeys.length > 0) {
          // Match SFX tokens possibly followed by trailing punctuation (.,!?…): capture token separately
          const escaped = sfxKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
          const re = new RegExp('(' + escaped.join('|') + ')([\u2000-\u206F\u2E00-\u2E7F\p{P}\p{S}]*)', 'giu');
          let lastIndex = 0;
          let m: RegExpExecArray | null;
          while ((m = re.exec(chunkText)) !== null) {
            if (m.index > lastIndex) {
              const textPart = chunkText.slice(lastIndex, m.index);
              if (textPart.trim().length > 0) segments.push({ type: 'text', value: textPart });
            }
            const matchedStr = m[1];
            const trailing = m[2] || '';
            const keyLower = matchedStr.toLowerCase();
            const file = sfxMap.get(keyLower);
            if (file) segments.push({ type: 'sfx', value: file });
            // push trailing punctuation back into stream as text
            if (trailing) segments.push({ type: 'text', value: trailing });
            lastIndex = m.index + matchedStr.length + trailing.length;
          }
          if (lastIndex < chunkText.length) {
            const tail = chunkText.slice(lastIndex);
            if (tail.trim().length > 0) segments.push({ type: 'text', value: tail });
          }
        }
        if (segments.length === 0) segments = [{ type: 'text', value: chunkText }];

        // Process segments: TTS for text, fetch for sfx, then merge
        const files: File[] = [];
        let failed = false;
        for (const seg of segments) {
          if (runIdRef.current !== myRun) { failed = true; break; }
          while (pauseRef.current) {
            if (runIdRef.current !== myRun) { failed = true; break; }
            await new Promise((r) => setTimeout(r, 200));
          }
          if (failed) break;
          if (seg.type === 'sfx') {
            try {
              const resp = await fetch(`/soundeffect/${encodeURIComponent(seg.value)}`);
              if (!resp.ok) { failed = true; break; }
              const b = await resp.blob();
              files.push(new File([b], seg.value, { type: b.type || 'audio/mpeg' }));
            } catch { failed = true; break; }
          } else {
            const txt = seg.value.trim();
            if (txt.length === 0) continue;
            // Skip segments that are only punctuation/symbols (e.g., "." after SFX)
            if (/^[\p{P}\p{S}]+$/u.test(txt)) continue;
            const fd = new FormData();
            fd.append('text', txt);
            fd.append('modelDir', modelDir);
            fd.append('checkpointName', checkpointName);
            fd.append('tokenizer', tokenizer);
            fd.append('lang', lang);
            fd.append('voiceName', voiceName);
            fd.append('normalized', 'true');
            const res = await fetch('/api/tts', { method: 'POST', body: fd });
            if (!res.ok) { failed = true; break; }
            const b = await res.blob();
            files.push(new File([b], `seg_${files.length}.wav`, { type: 'audio/wav' }));
          }
        }
        if (failed || files.length === 0) {
          results.push({ idx: i, ok: false, error: 'Ghép âm thanh thất bại' });
          setChunks((prev) => prev.map((c, idx) => idx === i ? { ...c, status: 'error', error: 'Ghép âm thanh thất bại' } : c));
        } else if (files.length === 1 && files[0].type === 'audio/wav') {
          const url = URL.createObjectURL(files[0]);
          results.push({ idx: i, ok: true });
          setChunks((prev) => prev.map((c, idx) => idx === i ? { ...c, status: 'done', audioUrl: url } : c));
        } else {
          const mfd = new FormData();
          files.forEach((f) => mfd.append('files', f));
          mfd.append('outputName', `chunk_${i}.wav`);
          const mres = await fetch('/api/merge', { method: 'POST', body: mfd });
          if (!mres.ok) {
            results.push({ idx: i, ok: false, error: 'Ghép âm thanh thất bại' });
            setChunks((prev) => prev.map((c, idx) => idx === i ? { ...c, status: 'error', error: 'Ghép âm thanh thất bại' } : c));
          } else {
            const merged = await mres.blob();
            const url = URL.createObjectURL(merged);
            results.push({ idx: i, ok: true });
            setChunks((prev) => prev.map((c, idx) => idx === i ? { ...c, status: 'done', audioUrl: url } : c));
          }
        }
        setProgress((p) => ({ total: p.total, done: p.done + 1 }));
      }

      // auto-merge if all succeeded
      const okBlobs = results.filter(r => r.ok && r.blob).map(r => r.blob!) as Blob[];
      if (okBlobs.length > 0) {
        const mergeFd = new FormData();
        okBlobs.forEach((b, i) => mergeFd.append('files', new File([b], `part_${i}.wav`, { type: 'audio/wav' })));
        mergeFd.append('outputName', outputName || 'output_merged.wav');
        const mergeRes = await fetch('/api/merge', { method: 'POST', body: mergeFd });
        if (mergeRes.ok) {
          const mergedBlob = await mergeRes.blob();
          const mergedUrl = URL.createObjectURL(mergedBlob);
          setFinalMergedUrl(mergedUrl);
          setAudioUrl(mergedUrl);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // invalidate current run and reset flags
    runIdRef.current++;
    setText('');
    setError('');
    setAudioUrl(null);
    setChunks([]);
    setProgress({ total: 0, done: 0 });
    setFinalMergedUrl(null);
    setIsPaused(false);
    setIsLoading(false);
    setIsAutoPlay(false);
    try { audioRef.current?.pause(); } catch {}
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fetchVoices = async () => {
    try {
      const res = await fetch('/api/voices');
      const data = await res.json();
      if (res.ok && Array.isArray(data.voices)) {
        setSavedVoices(data.voices);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchCheckpoints = async (dir: string) => {
    try {
      setIsLoadingCkpt(true);
      const url = `/api/checkpoints?modelDir=${encodeURIComponent(dir)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && Array.isArray(data.checkpoints)) {
        setCheckpoints(data.checkpoints);

        // Chọn checkpoint có iteration lớn nhất theo định dạng iter-<number>
        const extractIter = (name: string) => {
          const m = name.match(/iter-(\d+)/);
          return m ? parseInt(m[1], 10) : -1;
        };
        const best = [...data.checkpoints]
          .sort((a, b) => extractIter(b) - extractIter(a))[0];
        const currentIter = extractIter(checkpointName);
        const bestIter = extractIter(best || '');
        if (best && (!data.checkpoints.includes(checkpointName) || currentIter < bestIter)) {
          setCheckpointName(best);
        }
      }
    } catch (e) {
      // ignore; UI sẽ vẫn cho phép nhập tay
    } finally {
      setIsLoadingCkpt(false);
    }
  };

  useEffect(() => {
    fetchCheckpoints(modelDir);
    fetchVoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelDir]);

  // Auto-play sequences of already-generated chunks
  useEffect(() => {
    if (!isAutoPlay) return;
    const current = chunks[selectedIdx];
    if (!current || !current.audioUrl) return;
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => {
      let next = selectedIdx + 1;
      while (next < chunks.length && !chunks[next].audioUrl) next++;
      if (next < chunks.length) {
        setSelectedIdx(next);
      } else {
        setIsAutoPlay(false);
      }
    };
    el.addEventListener('ended', onEnded);
    el.play().catch(() => {});
    return () => {
      el.removeEventListener('ended', onEnded);
    };
  }, [isAutoPlay, selectedIdx, chunks]);

  const handleCreateVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoiceName || !newPromptWav) {
      setError('Cần nhập tên giọng và chọn prompt audio');
      return;
    }
    try {
      setIsSavingVoice(true);
      const fd = new FormData();
      fd.append('name', newVoiceName);
      fd.append('promptWav', newPromptWav);
      fd.append('promptText', newPromptText);
      const res = await fetch('/api/voices', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu giọng thất bại');
      await fetchVoices();
      setShowAddVoice(false);
      setNewVoiceName('');
      setNewPromptWav(null);
      setNewPromptText('');
      setVoiceName(data.voice?.name || newVoiceName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu giọng');
    } finally {
      setIsSavingVoice(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              ZipVoice Text-to-Speech
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Chuyển đổi văn bản thành giọng nói với ZipVoice
            </p>
          </div>

          {/* Info Panel */}
          <InfoPanel />

          {/* Main Form */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 text-gray-800 dark:text-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Voice picker as selectable buttons + Add New Voice */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Chọn giọng đã lưu
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddVoice(true)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm"
                  >
                    Thêm giọng mới
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedVoices.length === 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">Chưa có giọng nào. Nhấn &quot;Thêm giọng mới&quot; để tạo.</span>
                  )}
                  {savedVoices.map((v) => {
                    const selected = voiceName === v.name;
                    return (
                      <div
                        key={v.name}
                        role="button"
                        tabIndex={0}
                        onClick={() => setVoiceName(v.name)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setVoiceName(v.name); } }}
                        className={`cursor-pointer px-3 py-2 rounded-md border text-sm transition-colors inline-flex items-center gap-2 ${selected ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        aria-pressed={selected}
                        title={v.promptText || v.name}
                      >
                        {selected ? (
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L8.5 11.086l6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        ) : (
                          <span className="w-4 h-4 inline-block rounded border border-gray-400 dark:border-gray-500" />
                        )}
                        <span className="truncate max-w-[10rem]">{v.name}</span>
                        <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 max-w-[14rem] truncate ml-1">
                          {v.promptText}
                        </span>
                        <span className="inline-flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditOriginalName(v.name);
                              setEditName(v.name);
                              setEditPromptText(v.promptText || '');
                              setEditPromptWav(null);
                              if (editVoiceFileRef.current) editVoiceFileRef.current.value = '';
                              setShowEditVoice(true);
                            }}
                            className="px-2 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          >Sửa</button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm(`Xoá giọng '${v.name}'?`)) return;
                              const res = await fetch(`/api/voices/${encodeURIComponent(v.name)}`, { method: 'DELETE' });
                              if (res.ok) {
                                if (voiceName === v.name) setVoiceName('');
                                fetchVoices();
                              } else {
                                const data = await res.json();
                                alert(data.error || 'Xoá thất bại');
                              }
                            }}
                            className="px-2 py-0.5 text-xs border border-red-300 text-red-600 dark:text-red-400 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          >Xoá</button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Prompt input đã bỏ - dùng từ giọng đã lưu */}

              {/* Text to Convert */}
              <div>
                <label htmlFor="text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text to Convert (Văn bản cần chuyển thành giọng nói)
                </label>
                <textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập văn bản cần chuyển thành giọng nói..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={4}
                />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div className="md:col-span-2">
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Từ điển đã lưu</div>
                    <button
                      type="button"
                      className="px-2 py-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                      onClick={() => {
                        const newDict: Dictionary = { id: 'd' + Date.now(), name: 'Tu dien ' + (dictionaries.length + 1), entries: [] };
                        setEditingDict(newDict);
                        setShowDictEditor(true);
                      }}
                    >Thêm từ điển</button>
                  </div>
                  <div className="space-y-2">
                    {dictionaries.length === 0 && (
                      <div className="text-xs text-gray-500">Chưa có từ điển nào</div>
                    )}
                    {dictionaries.map((d) => (
                      <div key={d.id} className={`p-2 rounded border ${selectedDictIds.includes(d.id) ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600'}`}>
                        <div className="flex items-center justify-between">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedDictIds.includes(d.id)}
                              onChange={(e) => {
                                setSelectedDictIds((prev) => e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id));
                              }}
                            />
                            <span className="font-medium">{d.name}</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="px-2 py-1 text-xs border rounded"
                              onClick={() => { setEditingDict({ ...d, entries: d.entries.map(e => ({...e})) }); setShowDictEditor(true); }}
                            >Sửa</button>
                            <button
                              type="button"
                              className="px-2 py-1 text-xs border border-red-400 text-red-600 rounded"
                              onClick={() => {
                                if (!confirm('Xoá từ điển này?')) return;
                                setDictionaries((prev) => prev.filter(x => x.id !== d.id));
                                setSelectedDictIds((prev) => prev.filter((x) => x !== d.id));
                                if (expandedDictId === d.id) setExpandedDictId(null);
                              }}
                            >Xoá</button>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-center">
                          <button
                            type="button"
                            className="px-2 py-1 text-xs border rounded"
                            onClick={() => setExpandedDictId((prev) => prev === d.id ? null : d.id)}
                          >{expandedDictId === d.id ? 'Ẩn danh sách từ' : 'Hiện danh sách từ'}</button>
                        </div>
                        {expandedDictId === d.id && d.entries.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            {d.entries.map((e, idx) => (
                              <div key={idx} className="truncate">{e.from} ⇒ {e.to}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Số câu/lượt: <span className="font-semibold">{batchSize}</span></label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={batchSize}
                  onChange={(e) => setBatchSize(Math.max(1, Math.min(10, Number(e.target.value) || 4)))}
                  className="w-full"
                  aria-label="Số câu mỗi lượt"
                />
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">Tên file gộp</label>
                <input
                  type="text"
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <label className="inline-flex items-center gap-2 mt-3 text-sm">
                  <input type="checkbox" checked={saveToServer} onChange={(e) => setSaveToServer(e.target.checked)} />
                  Lưu file gộp lên server (thư mục output/)
                </label>
                <div className="mt-6 border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Từ điển âm thanh</div>
                    <button
                      type="button"
                      className="px-2 py-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                      onClick={() => { const nd = { id: 's' + Date.now(), name: 'SFX ' + (sfxDictionaries.length + 1), entries: [] as SoundEntry[] }; setEditingSfxDict(nd); setShowSfxEditor(true); }}
                    >Thêm từ điển</button>
                  </div>
                  <div className="space-y-2">
                    {sfxDictionaries.length === 0 && <div className="text-xs text-gray-500">Chưa có từ điển âm thanh</div>}
                    {sfxDictionaries.map((d) => (
                      <div key={d.id} className={`p-2 rounded border ${selectedSfxDictIds.includes(d.id) ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600'}`}>
                        <div className="flex items-center justify-between">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={selectedSfxDictIds.includes(d.id)} onChange={(e) => setSelectedSfxDictIds((prev) => e.target.checked ? [...prev, d.id] : prev.filter(x => x !== d.id))} />
                            <span className="font-medium">{d.name}</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => { setEditingSfxDict({ ...d, entries: d.entries.map(e => ({...e})) }); setShowSfxEditor(true); }}>Sửa</button>
                            <button type="button" className="px-2 py-1 text-xs border border-red-400 text-red-600 rounded" onClick={() => { if (!confirm('Xoá từ điển này?')) return; setSfxDictionaries(prev => prev.filter(x => x.id !== d.id)); setSelectedSfxDictIds(prev => prev.filter(x => x !== d.id)); if (expandedSfxDictId === d.id) setExpandedSfxDictId(null); }}>Xoá</button>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-center">
                          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => setExpandedSfxDictId(prev => prev === d.id ? null : d.id)}>{expandedSfxDictId === d.id ? 'Ẩn danh sách từ' : 'Hiện danh sách từ'}</button>
                        </div>
                        {expandedSfxDictId === d.id && d.entries.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            {d.entries.map((e, idx) => (
                              <div key={idx} className="truncate">{e.from} ⇒ {e.file}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
              </div>

              {/* Advanced Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modelDir" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Model Directory
                  </label>
                  <input
                    id="modelDir"
                    type="text"
                    value={modelDir}
                    onChange={(e) => setModelDir(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="checkpointName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Checkpoint Name
                  </label>
                  {checkpoints.length > 0 ? (
                    <select
                      id="checkpointName"
                      value={checkpointName}
                      onChange={(e) => setCheckpointName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {checkpoints.map((ckpt) => (
                        <option key={ckpt} value={ckpt}>{ckpt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="checkpointName"
                      type="text"
                      value={checkpointName}
                      onChange={(e) => setCheckpointName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder={isLoadingCkpt ? 'Đang tải checkpoints...' : 'Nhập tên checkpoint'}
                    />
                  )}
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Thư mục: {modelDir}
                  </div>
        </div>
                <div>
                  <label htmlFor="tokenizer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tokenizer
                  </label>
                  <select
                    id="tokenizer"
                    value={tokenizer}
                    onChange={(e) => setTokenizer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="espeak">espeak</option>
                    <option value="emilia">emilia</option>
                    <option value="libritts">libritts</option>
                    <option value="simple">simple</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="lang" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <input
                    id="lang"
                    type="text"
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    'Tạo Giọng Nói'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaused((p) => !p)}
                  disabled={!isLoading}
                  className={`px-6 py-3 ${isPaused ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-yellow-600 hover:bg-yellow-700'} disabled:bg-gray-400 text-white font-medium rounded-md transition-colors duration-200`}
                >
                  {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Lỗi
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          

          {/* Progress & Workspace */}
          {(chunks.length > 0 || isLoading) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg p-4">
                <div className="mb-2 text-sm">Tiến độ: {progress.done}/{progress.total}</div>
                {selectedIdx >= 0 && chunks[selectedIdx] && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium">Đoạn văn bản đang chọn</label>
                    <textarea
                      value={chunks[selectedIdx].text}
                      onChange={(e) => setChunks((prev) => prev.map((c, i) => i === selectedIdx ? { ...c, text: e.target.value } : c))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      rows={8}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          // Re-run this chunk with SFX aware split
                          const chunkIdx = selectedIdx;
                          const textNow = chunks[chunkIdx]?.text || '';
                          setChunks((prev) => prev.map((c, i) => i === chunkIdx ? { ...c, status: 'processing' } : c));

                          // Build SFX map
                          const sfxMap = new Map<string, string>();
                          sfxDictionaries.filter(d => selectedSfxDictIds.includes(d.id)).forEach(d => {
                            d.entries.forEach(en => { if (en.from && en.file) sfxMap.set(en.from.trim().toLowerCase(), en.file.trim()); });
                          });

                          // Split into segments
                          const sfxKeys = Array.from(sfxMap.keys()).filter(k => k.length > 0).sort((a, b) => b.length - a.length);
                          let segments: Array<{ type: 'text' | 'sfx'; value: string }> = [];
                          if (sfxKeys.length > 0) {
                            const escaped = sfxKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                            const re = new RegExp('(' + escaped.join('|') + ')([\u2000-\u206F\u2E00-\u2E7F\p{P}\p{S}]*)', 'giu');
                            let lastIndex = 0;
                            let m: RegExpExecArray | null;
                            while ((m = re.exec(textNow)) !== null) {
                              if (m.index > lastIndex) {
                                const textPart = textNow.slice(lastIndex, m.index);
                                if (textPart.trim().length > 0) segments.push({ type: 'text', value: textPart });
                              }
                              const matchedStr = m[1];
                              const trailing = m[2] || '';
                              const keyLower = matchedStr.toLowerCase();
                              const file = sfxMap.get(keyLower);
                              if (file) segments.push({ type: 'sfx', value: file });
                              if (trailing) segments.push({ type: 'text', value: trailing });
                              lastIndex = m.index + matchedStr.length + trailing.length;
                            }
                            if (lastIndex < textNow.length) {
                              const tail = textNow.slice(lastIndex);
                              if (tail.trim().length > 0) segments.push({ type: 'text', value: tail });
                            }
                          }
                          if (segments.length === 0) segments = [{ type: 'text', value: textNow }];

                          try {
                            const files: File[] = [];
                            for (const seg of segments) {
                              if (seg.type === 'sfx') {
                                const resp = await fetch(`/soundeffect/${encodeURIComponent(seg.value)}`);
                                if (!resp.ok) throw new Error('Không tải được SFX');
                                const b = await resp.blob();
                                files.push(new File([b], seg.value, { type: b.type || 'audio/mpeg' }));
                              } else {
                                const txt = seg.value.trim();
                                if (txt.length === 0) continue;
                                if (/^[\p{P}\p{S}]+$/u.test(txt)) continue;
                                const fd = new FormData();
                                fd.append('text', txt);
                                fd.append('modelDir', modelDir);
                                fd.append('checkpointName', checkpointName);
                                fd.append('tokenizer', tokenizer);
                                fd.append('lang', lang);
                                fd.append('voiceName', voiceName);
                                fd.append('normalized', 'true');
                                const res = await fetch('/api/tts', { method: 'POST', body: fd });
                                if (!res.ok) throw new Error('TTS lỗi');
                                const b = await res.blob();
                                files.push(new File([b], `seg_${files.length}.wav`, { type: 'audio/wav' }));
                              }
                            }
                            if (files.length === 0) throw new Error('Không có dữ liệu âm thanh');
                            if (files.length === 1 && files[0].type === 'audio/wav') {
                              const url = URL.createObjectURL(files[0]);
                              setChunks((prev) => prev.map((c, i) => i === chunkIdx ? { ...c, status: 'done', audioUrl: url } : c));
                            } else {
                              const mfd = new FormData();
                              files.forEach((f) => mfd.append('files', f));
                              mfd.append('outputName', `chunk_${chunkIdx}.wav`);
                              const mres = await fetch('/api/merge', { method: 'POST', body: mfd });
                              if (!mres.ok) throw new Error('Ghép âm thanh thất bại');
                              const merged = await mres.blob();
                              const url = URL.createObjectURL(merged);
                              setChunks((prev) => prev.map((c, i) => i === chunkIdx ? { ...c, status: 'done', audioUrl: url } : c));
                            }
                          } catch (e) {
                            const msg = (e as Error).message || 'Lỗi không xác định';
                            setChunks((prev) => prev.map((c, i) => i === chunkIdx ? { ...c, status: 'error', error: msg } : c));
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >Chạy lại đoạn này</button>
                      <button
                        type="button"
                        onClick={() => setSelectedIdx((i) => Math.max(0, i - 1))}
                        className="px-3 py-2 border rounded"
                      >◀ Trước</button>
                      <button
                        type="button"
                        onClick={() => setSelectedIdx((i) => Math.min(chunks.length - 1, i + 1))}
                        className="px-3 py-2 border rounded"
                      >Sau ▶</button>
                      <button
                        type="button"
                        onClick={() => {
                          const el = audioRef.current;
                          if (!isAutoPlay) {
                            setIsAutoPlay(true);
                            setTimeout(() => el?.play().catch(() => {}), 0);
                          } else {
                            el?.pause();
                            setIsAutoPlay(false);
                          }
                        }}
                        className={`px-3 py-2 rounded text-white ${isAutoPlay ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                      >{isAutoPlay ? 'Tạm dừng' : 'Bắt đầu'}</button>
                    </div>
                    {chunks[selectedIdx].audioUrl && (
                      <audio ref={audioRef} key={(chunks[selectedIdx].audioUrl || '') + ':' + selectedIdx} controls className="w-full mt-2">
                        <source src={chunks[selectedIdx].audioUrl} type="audio/wav" />
                      </audio>
                    )}
                  </div>
                )}
                {finalMergedUrl && (
                  <div className="mt-6 border-t pt-4">
                    <div className="font-medium mb-2">File đã gộp</div>
                    {savedServerPath && (
                      <div className="text-xs mb-2 text-gray-600 dark:text-gray-300 break-all">Đã lưu trên server: {savedServerPath}</div>
                    )}
                <audio controls className="w-full">
                      <source src={finalMergedUrl} type="audio/wav" />
                </audio>
                    <a href={finalMergedUrl} download={outputName || 'merged.wav'} className="inline-block mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Tải xuống</a>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg p-4">
                <div className="font-medium mb-2">Danh sách đoạn</div>
                <div className="space-y-2 max-h-[460px] overflow-auto">
                  {chunks.map((c, i) => (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedIdx(i)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedIdx(i); }}}
                      className={`p-2 rounded border cursor-pointer ${i === selectedIdx ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600'}`}
                    >
                      <div className="text-xs text-gray-500 mb-1">#{i + 1} • {c.status}</div>
                      <div className="text-sm line-clamp-2">{c.text}</div>
                </div>
                  ))}
                </div>
                {chunks.length > 0 && (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={isMerging}
                      onClick={async () => {
                        try {
                          setIsMerging(true);
                          // merge current available done chunks
                          const files: File[] = [];
                          for (let i = 0; i < chunks.length; i++) {
                            if (chunks[i].audioUrl) {
                              const resp = await fetch(chunks[i].audioUrl!);
                              if (!resp.ok) continue;
                              const b = await resp.blob();
                              files.push(new File([b], `part_${i}.wav`, { type: 'audio/wav' }));
                            }
                          }
                          if (files.length === 0) {
                            alert('Chưa có đoạn âm thanh nào để gộp.');
                            return;
                          }
                        const fd = new FormData();
                          files.forEach((f) => fd.append('files', f));
                          fd.append('outputName', outputName || 'output_merged.wav');
                        fd.append('save', String(saveToServer));
                        // if chunks were saved on disk, pass their paths to delete after merge
                        const pathsToDelete: string[] = [];
                        // (Currently we do not persist per-chunk files on server, so this stays empty.)
                        // If in the future you save chunk files on server and keep their absolute paths
                        // alongside each chunk, push them here.
                        pathsToDelete.forEach((p) => fd.append('deletePaths', p));
                        const res = await fetch('/api/merge', { method: 'POST', body: fd });
                          if (!res.ok) {
                            let msg = 'Gộp file thất bại';
                            try {
                              const data = await res.json();
                              if (data?.error) msg = data.error;
                            } catch {}
                            alert(msg);
                            return;
                          }
                        const serverPath = res.headers.get('X-Saved-Path');
                        setSavedServerPath(serverPath);
                        const merged = await res.blob();
                          const url = URL.createObjectURL(merged);
                          setFinalMergedUrl(url);
                          setAudioUrl(url);
                        } finally {
                          setIsMerging(false);
                        }
                      }}
                      className={`px-3 py-2 rounded text-white ${isMerging ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'}`}
                    >{isMerging ? 'Đang gộp...' : 'Gộp file'}</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Thêm Giọng Mới */}
          {/* Modal Sửa/Tạo Từ điển âm thanh */}
          {showSfxEditor && editingSfxDict && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{sfxDictionaries.find(d => d.id === editingSfxDict.id) ? 'Sửa từ điển âm thanh' : 'Tạo từ điển âm thanh'}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tên từ điển</label>
                    <input value={editingSfxDict.name} onChange={(e) => setEditingSfxDict({ ...editingSfxDict, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Các mục (từ gốc =&gt; file .mp3/.wav trong /soundeffect)</label>
                      <button type="button" className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded" onClick={() => setEditingSfxDict({ ...editingSfxDict, entries: [{ from: '', file: '' }, ...editingSfxDict.entries] })}>Thêm</button>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <input ref={sfxImportRef} type="file" accept=".txt" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const text = await file.text();
                          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                          const entries: SoundEntry[] = [];
                          for (const line of lines) {
                            const parts = line.split('=>');
                            const from = (parts[0] || '').trim();
                            const f = (parts[1] || '').trim();
                            if (!from) continue;
                            entries.push({ from, file: f });
                          }
                          // merge by from
                          const map = new Map<string, string>();
                          editingSfxDict.entries.forEach(en => { if (en.from) map.set(en.from, en.file); });
                          entries.forEach(en => { if (en.from) map.set(en.from, en.file); });
                          const merged = Array.from(map.entries()).map(([from, file]) => ({ from, file }));
                          setEditingSfxDict({ ...editingSfxDict, entries: merged });
                        } finally {
                          if (sfxImportRef.current) sfxImportRef.current.value = '';
                        }
                      }} />
                      <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => sfxImportRef.current?.click()}>Nhập (.txt)</button>
                      <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => {
                        const lines = editingSfxDict.entries.filter(e => e.from).map(e => `${e.from}=>${e.file}`);
                        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
                        const a = document.createElement('a');
                        const safeName = (editingSfxDict.name || 'sfx').replace(/[^\w\-]+/g, '_');
                        a.href = URL.createObjectURL(blob);
                        a.download = `${safeName}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                      }}>Xuất (.txt)</button>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-auto">
                      {editingSfxDict.entries.map((en, idx) => (
                        <div key={idx} className="grid grid-cols-2 gap-2 items-center">
                          <input placeholder="Từ gốc" value={en.from} onChange={(e) => { const arr = [...editingSfxDict.entries]; arr[idx] = { ...arr[idx], from: e.target.value }; setEditingSfxDict({ ...editingSfxDict, entries: arr }); }} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                          <div className="flex gap-2">
                            <input placeholder="File trong /soundeffect (vd: Amm.mp3)" value={en.file} onChange={(e) => { const arr = [...editingSfxDict.entries]; arr[idx] = { ...arr[idx], file: e.target.value }; setEditingSfxDict({ ...editingSfxDict, entries: arr }); }} className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                            <button type="button" className="px-2 py-2 text-xs border border-red-400 text-red-600 rounded" onClick={() => { const arr = editingSfxDict.entries.filter((_, i) => i !== idx); setEditingSfxDict({ ...editingSfxDict, entries: arr }); }}>Xoá</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowSfxEditor(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300">Huỷ</button>
                    <button type="button" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md" onClick={() => {
                      if (!editingSfxDict.name.trim()) { alert('Tên từ điển không được để trống'); return; }
                      setSfxDictionaries((prev) => {
                        const exists = prev.find(x => x.id === editingSfxDict.id);
                        if (exists) return prev.map(x => x.id === editingSfxDict.id ? editingSfxDict : x);
                        return [...prev, editingSfxDict];
                      });
                      setSelectedSfxDictIds((prev) => Array.from(new Set([...prev, editingSfxDict.id])));
                      setShowSfxEditor(false);
                    }}>Lưu</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Modal Sửa/Tạo Từ Điển */}
          {showDictEditor && editingDict && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{dictionaries.find(d => d.id === editingDict.id) ? 'Sửa từ điển' : 'Tạo từ điển'}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tên từ điển</label>
                    <input
                      value={editingDict.name}
                      onChange={(e) => setEditingDict({ ...editingDict, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Các mục chuyển đổi</label>
                      <button
                        type="button"
                        className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                        onClick={() => setEditingDict({ ...editingDict, entries: [{ from: '', to: '' }, ...editingDict.entries] })}
                      >Thêm</button>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        ref={dictImportRef}
                        type="file"
                        accept=".txt"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const text = await file.text();
                            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                            const newEntries: DictEntry[] = [];
                            for (const line of lines) {
                              const parts = line.split('=>');
                              const from = (parts[0] || '').trim();
                              const to = (parts[1] || '').trim();
                              if (from.length === 0) continue;
                              newEntries.push({ from, to });
                            }
                            // merge by 'from' (latest wins)
                            const map = new Map<string, string>();
                            editingDict.entries.forEach(en => { if (en.from) map.set(en.from, en.to); });
                            newEntries.forEach(en => { if (en.from) map.set(en.from, en.to); });
                            const merged = Array.from(map.entries()).map(([from, to]) => ({ from, to }));
                            setEditingDict({ ...editingDict, entries: merged });
                          } finally {
                            if (dictImportRef.current) dictImportRef.current.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="px-2 py-1 text-xs border rounded"
                        onClick={() => dictImportRef.current?.click()}
                      >Nhập (.txt)</button>
                      <button
                        type="button"
                        className="px-2 py-1 text-xs border rounded"
                        onClick={() => {
                          const lines = editingDict.entries.filter(e => e.from).map(e => `${e.from}=>${e.to}`);
                          const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
                          const a = document.createElement('a');
                          const safeName = (editingDict.name || 'dictionary').replace(/[^\w\-]+/g, '_');
                          a.href = URL.createObjectURL(blob);
                          a.download = `${safeName}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                        }}
                      >Xuất (.txt)</button>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-auto">
                      {editingDict.entries.map((en, idx) => (
                        <div key={idx} className="grid grid-cols-2 gap-2 items-center">
                          <input
                            placeholder="Từ gốc"
                            value={en.from}
                            onChange={(e) => {
                              const arr = [...editingDict.entries];
                              arr[idx] = { ...arr[idx], from: e.target.value };
                              setEditingDict({ ...editingDict, entries: arr });
                            }}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                          />
                          <div className="flex gap-2">
                            <input
                              placeholder="Chuyển thành"
                              value={en.to}
                              onChange={(e) => {
                                const arr = [...editingDict.entries];
                                arr[idx] = { ...arr[idx], to: e.target.value };
                                setEditingDict({ ...editingDict, entries: arr });
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                            />
                            <button
                              type="button"
                              className="px-2 py-2 text-xs border border-red-400 text-red-600 rounded"
                              onClick={() => {
                                const arr = editingDict.entries.filter((_, i) => i !== idx);
                                setEditingDict({ ...editingDict, entries: arr });
                              }}
                            >Xoá</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowDictEditor(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300">Huỷ</button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      onClick={() => {
                        if (!editingDict.name.trim()) { alert('Tên từ điển không được để trống'); return; }
                        setDictionaries((prev) => {
                          const exists = prev.find((x) => x.id === editingDict.id);
                          if (exists) {
                            return prev.map((x) => x.id === editingDict.id ? editingDict : x);
                          }
                          return [...prev, editingDict];
                        });
                        setSelectedDictIds((prev) => Array.from(new Set([...prev, editingDict.id])));
                        setShowDictEditor(false);
                      }}
                    >Lưu</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showAddVoice && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Thêm giọng mới</h3>
                <form onSubmit={handleCreateVoice} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên giọng</label>
                    <input
                      value={newVoiceName}
                      onChange={(e) => setNewVoiceName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      placeholder="Ví dụ: Giong_Nam_Bac"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt Audio (.wav)</label>
                    <input
                      ref={addVoiceFileRef}
                      type="file"
                      accept=".wav,.mp3,.m4a"
                      onChange={handleAddVoiceFileChange}
                      className="w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt Text</label>
                    <textarea
                      value={newPromptText}
                      onChange={(e) => setNewPromptText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      rows={3}
                      placeholder="Nhập nội dung của prompt audio"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddVoice(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300">Huỷ</button>
                    <button type="submit" disabled={isSavingVoice} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-md">
                      {isSavingVoice ? 'Đang lưu...' : 'Lưu giọng'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Sửa Giọng */}
          {showEditVoice && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Sửa giọng</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const fd = new FormData();
                      if (editName && editName !== editOriginalName) fd.append('newName', editName);
                      fd.append('promptText', editPromptText || '');
                      if (editPromptWav) fd.append('promptWav', editPromptWav);
                      const res = await fetch(`/api/voices/${encodeURIComponent(editOriginalName)}`, { method: 'PUT', body: fd });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Cập nhật thất bại');
                      await fetchVoices();
                      if (voiceName === editOriginalName) setVoiceName(editName || editOriginalName);
                      setShowEditVoice(false);
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Cập nhật thất bại');
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên giọng</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt Audio (tuỳ chọn)</label>
                    <input
                      ref={editVoiceFileRef}
                      type="file"
                      accept=".wav,.mp3,.m4a"
                      onChange={(e) => setEditPromptWav(e.target.files?.[0] || null)}
                      className="w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt Text</label>
                    <textarea
                      value={editPromptText}
                      onChange={(e) => setEditPromptText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowEditVoice(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300">Huỷ</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Lưu</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
