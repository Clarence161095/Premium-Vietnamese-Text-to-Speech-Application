#!/usr/bin/env python3
"""
Premium Vietnamese Text-to-Speech API - Version 2
Simplified sentence-by-sentence processing with GPU monitoring and performance metrics.
Using ZipVoice defaults for optimal Vietnamese speech synthesis.
"""

import asyncio
import datetime
import json
import os
import re
import shutil
import subprocess
import threading
import time
import uuid
from collections import deque
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import soundfile as sf
from fastapi import (BackgroundTasks, FastAPI, File, Form, HTTPException,
                     Request, Response, UploadFile)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Disable API access logging but keep error logging
import logging
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("fastapi").setLevel(logging.WARNING)

# === CONFIGURATION === #

# Directory paths
DATA_DIR = "/data"
ZIPVOICE_DIR = "/ZipVoice"
MODEL_DIR = "/models/zipvoice_vi"
CHECKPOINT_NAME = "iter-525000-avg-2.pt"
DEFAULT_PROFILE = "tina"
DOING_DIR = "/DOING"  # Temporary processing folder
DATA_LOG_FILE = "/data/data.json"  # Lightweight DB for rendering history

# Use ZipVoice defaults only (no advanced settings)
ZIPVOICE_DEFAULTS = {
    "tokenizer": "espeak",
    "lang": "vi",
    "model_name": "zipvoice",
    "model_dir": MODEL_DIR,
    "checkpoint_name": CHECKPOINT_NAME
}

# GPU monitoring thresholds
GPU_TEMP_EMERGENCY = 90  # Stop processing at 90°C
GPU_TEMP_THROTTLE = 85   # Reduce load at 85°C
TARGET_GPU_UTILIZATION = 85  # Target 85% utilization

# Performance metrics storage
class RenderMetrics:
    def __init__(self):
        self.recent_renders = deque(maxlen=1000)  # Last 1000 renders
        self.lock = threading.Lock()
    
    def add_render(self, word_count: int, render_time: float):
        with self.lock:
            self.recent_renders.append({
                'words': word_count,
                'time': render_time,
                'timestamp': datetime.datetime.now().isoformat()
            })
    
    def estimate_time(self, word_count: int) -> float:
        with self.lock:
            if not self.recent_renders:
                return word_count * 0.5  # Fallback estimate
            
            avg_time_per_word = sum(r['time']/max(r['words'], 1) for r in self.recent_renders) / len(self.recent_renders)
            return word_count * avg_time_per_word
    
    def get_stats(self) -> Dict[str, Any]:
        with self.lock:
            if not self.recent_renders:
                return {"total_renders": 0, "avg_time_per_word": 0.5}
            
            total_renders = len(self.recent_renders)
            avg_time_per_word = sum(r['time']/max(r['words'], 1) for r in self.recent_renders) / total_renders
            
            return {
                "total_renders": total_renders,
                "avg_time_per_word": avg_time_per_word,
                "last_render": self.recent_renders[-1] if self.recent_renders else None
            }

# Global instances
render_metrics = RenderMetrics()
current_process = None  # Track current rendering process for stop functionality

# === PYDANTIC MODELS === #

class SynthesisRequest(BaseModel):
    """Simplified request model for version 2 - only text and profile"""
    text: str
    profile_id: Optional[str] = None

class ProfileResponse(BaseModel):
    """Response model for profile information"""
    name: str
    description: str
    path: str
    is_default: bool
    created_at: str

class GPUStatus(BaseModel):
    """GPU status response model"""
    temperature: float
    utilization: float
    memory_used: float
    memory_total: float
    status: str  # "NORMAL", "THROTTLE", "EMERGENCY"

class RenderStatus(BaseModel):
    """Current rendering status"""
    is_rendering: bool
    current_sentence: int
    total_sentences: int
    estimated_time_remaining: float
    elapsed_time: float

# === GPU MONITORING FUNCTIONS === #

def get_gpu_status() -> GPUStatus:
    """Get current GPU temperature, utilization and memory status"""
    try:
        # Try to get GPU info using nvidia-ml-py
        result = subprocess.run(['nvidia-smi', '--query-gpu=temperature.gpu,utilization.gpu,memory.used,memory.total', '--format=csv,noheader,nounits'], 
                              capture_output=True, text=True, timeout=5)
        
        if result.returncode == 0:
            temp, util, mem_used, mem_total = result.stdout.strip().split(', ')
            temp = float(temp)
            util = float(util)
            mem_used = float(mem_used)
            mem_total = float(mem_total)
            
            # Determine status based on temperature
            if temp >= GPU_TEMP_EMERGENCY:
                status = "EMERGENCY"
            elif temp >= GPU_TEMP_THROTTLE:
                status = "THROTTLE"
            else:
                status = "NORMAL"
            
            return GPUStatus(
                temperature=temp,
                utilization=util,
                memory_used=mem_used,
                memory_total=mem_total,
                status=status
            )
    except Exception as e:
        print(f"[WARN] Could not get GPU status: {e}")
    
    # Fallback for systems without GPU or nvidia-smi
    return GPUStatus(
        temperature=0.0,
        utilization=0.0,
        memory_used=0.0,
        memory_total=0.0,
        status="UNKNOWN"
    )

def should_stop_processing() -> bool:
    """Check if processing should be stopped due to high GPU temperature"""
    gpu_status = get_gpu_status()
    return gpu_status.status == "EMERGENCY"

def should_throttle_processing() -> bool:
    """Check if processing should be throttled due to elevated GPU temperature"""
    gpu_status = get_gpu_status()
    return gpu_status.status in ["THROTTLE", "EMERGENCY"]

# === STOP MECHANISM === #

class ProcessController:
    def __init__(self):
        self.should_stop = False
        self.current_process = None
        self.lock = threading.Lock()
    
    def stop_current_process(self):
        with self.lock:
            self.should_stop = True
            if self.current_process:
                try:
                    self.current_process.terminate()
                    print("[INFO] Terminated current rendering process")
                except Exception as e:
                    print(f"[WARN] Could not terminate process: {e}")
    
    def reset(self):
        with self.lock:
            self.should_stop = False
            self.current_process = None
    
    def is_stopped(self) -> bool:
        with self.lock:
            return self.should_stop

# Global process controller
process_controller = ProcessController()

# === FASTAPI APP SETUP === #

app = FastAPI(
    title="Premium Vietnamese TTS API - Version 2",
    description="Simplified Vietnamese speech synthesis with sentence-based processing and GPU monitoring",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === UTILITY FUNCTIONS === #

def load_data_log() -> List[Dict[str, Any]]:
    """Load rendering history from lightweight JSON database"""
    try:
        if os.path.exists(DATA_LOG_FILE):
            with open(DATA_LOG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
    except (json.JSONDecodeError, IOError) as e:
        print(f"[WARN] Failed to load data log: {e}")
    return []

def save_data_log(data: List[Dict[str, Any]]) -> None:
    """Save rendering history to lightweight JSON database"""
    try:
        # Ensure data directory exists
        os.makedirs(os.path.dirname(DATA_LOG_FILE), exist_ok=True)
        with open(DATA_LOG_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except IOError as e:
        print(f"[WARN] Failed to save data log: {e}")

def add_render_record(text: str, profile_id: str, audio_path: str, word_count: int, processing_time: float) -> None:
    """Add a new render record to the data log with automatic cleanup of old records"""
    try:
        data_log = load_data_log()
        
        # Create new record
        record = {
            "id": datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3],  # Unique ID with milliseconds
            "timestamp": datetime.datetime.now().isoformat(),
            "text": text[:200] + "..." if len(text) > 200 else text,  # Truncate long text for storage
            "full_text_preview": text[:50] + "..." if len(text) > 50 else text,  # Short preview
            "profile_id": profile_id,
            "audio_path": audio_path,
            "word_count": word_count,
            "processing_time": processing_time,
            "file_size": os.path.getsize(audio_path) if os.path.exists(audio_path) else 0
        }
        
        # Add to beginning of list (most recent first)
        data_log.insert(0, record)
        
        # Clean up old records: if more than 50 records, keep only the most recent 50
        if len(data_log) > 50:
            data_log = data_log[:50]
            print(f"[INFO] Cleaned up old records, keeping only the most recent 50 entries")
        
        save_data_log(data_log)
        print(f"[LOG] Added render record: {record['id']} ({word_count} words, {processing_time:.1f}s)")
        
    except Exception as e:
        print(f"[WARN] Failed to add render record: {e}")

def get_recent_renders(page: int = 1, per_page: int = 10) -> Dict[str, Any]:
    """Get paginated list of recent renders (keeps most recent 50 records)"""
    try:
        data_log = load_data_log()
        
        # Calculate pagination
        total_records = len(data_log)
        total_pages = max(1, (total_records + per_page - 1) // per_page)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        page_records = data_log[start_idx:end_idx]
        
        return {
            "records": page_records,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total_records": total_records,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    except Exception as e:
        print(f"[ERROR] Failed to get recent renders: {e}")
        return {
            "records": [],
            "pagination": {
                "page": 1,
                "per_page": per_page,
                "total_records": 0,
                "total_pages": 1,
                "has_next": False,
                "has_prev": False
            }
        }

def load_profiles() -> Dict[str, Any]:
    """Load voice profile metadata from JSON storage"""
    profiles_file = Path(DATA_DIR) / "profiles.json"
    if profiles_file.exists():
        try:
            with open(profiles_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"[WARN] Failed to load profiles: {e}")
    return {}

def save_profiles(profiles: Dict[str, Any]) -> None:
    """Save voice profile metadata to JSON storage"""
    profiles_file = Path(DATA_DIR) / "profiles.json"
    try:
        profiles_file.parent.mkdir(parents=True, exist_ok=True)
        with open(profiles_file, "w", encoding="utf-8") as f:
            json.dump(profiles, f, indent=2, ensure_ascii=False)
    except IOError as e:
        print(f"[ERROR] Failed to save profiles: {e}")
        raise HTTPException(500, f"Failed to save profile metadata: {str(e)}")

def run_command_with_monitoring(cmd: List[str], timeout: int = 300, **kwargs) -> subprocess.CompletedProcess:
    """Execute system command with GPU monitoring and timeout - increased timeout for longer texts"""
    print(f"[CMD] {' '.join(cmd)}")
    
    try:
        # Start the process
        process = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8',
            **kwargs
        )
        
        # Store process reference for potential termination
        with process_controller.lock:
            process_controller.current_process = process
        
        start_time = time.time()
        
        # Monitor process with GPU checks
        while True:
            # Check if process finished
            if process.poll() is not None:
                break
            
            # Check for stop signal
            if process_controller.is_stopped():
                print("[STOP] Terminating process due to user stop request")
                process.terminate()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    print("[FORCE] Force killing process")
                    process.kill()
                    process.wait()
                raise Exception("Process stopped by user request")
            
            # Check GPU temperature
            if should_stop_processing():
                print("[OVERHEAT] Terminating process due to high GPU temperature")
                process.terminate()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
                raise Exception("Process stopped due to high GPU temperature (>90°C)")
            
            # Check timeout - increased for longer texts
            if time.time() - start_time > timeout:
                print(f"[TIMEOUT] Process exceeded {timeout} seconds")
                process.terminate()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
                raise Exception(f"Process timeout after {timeout} seconds")
            
            # Brief sleep to avoid excessive polling
            time.sleep(2)
        
        # Get final output
        stdout, stderr = process.communicate()
        
        if stdout:
            print(f"[STDOUT] {stdout}")
        if stderr:
            print(f"[STDERR] {stderr}")
            
        if process.returncode != 0:
            error_details = f"Return code: {process.returncode}"
            if stderr:
                error_details += f"\nStderr: {stderr}"
            if stdout:
                error_details += f"\nStdout: {stdout}"
            print(f"[PROCESS_ERROR] {error_details}")
            raise subprocess.CalledProcessError(
                process.returncode, cmd, stdout, stderr
            )
        
        # Create result object
        result = subprocess.CompletedProcess(cmd, process.returncode, stdout, stderr)
        return result
        
    except Exception as e:
        error_msg = f"Command execution failed: {' '.join(cmd)}"
        if hasattr(e, 'stderr') and e.stderr:
            error_msg += f"\nStderr: {e.stderr}"
        if hasattr(e, 'stdout') and e.stdout:
            error_msg += f"\nStdout: {e.stdout}"
        print(f"[ERROR] {error_msg}")
        raise Exception(error_msg)
    
    finally:
        # Clean up process reference
        with process_controller.lock:
            process_controller.current_process = None

def ensure_prompt_wav(sample_path: str, out_dir: str) -> str:
    """Convert audio sample to 24kHz mono format for Vietnamese TTS compatibility"""
    prompt_wav = f"{out_dir}/prompt-24k.wav"
    
    # Verify input file exists
    if not os.path.exists(sample_path):
        raise FileNotFoundError(f"Sample audio file not found: {sample_path}")
    
    # Convert to 24kHz mono using FFmpeg
    cmd = [
        "ffmpeg", "-y", "-i", sample_path,
        "-ac", "1",      # Mono
        "-ar", "24000",  # 24kHz sample rate
        prompt_wav
    ]
    
    run_command_with_monitoring(cmd)
    
    # Verify output file was created
    if not os.path.exists(prompt_wav):
        raise Exception(f"Failed to create 24kHz audio: {prompt_wav}")
    
    print(f"[SUCCESS] Converted audio to 24kHz mono: {prompt_wav}")
    return prompt_wav

def clean_vietnamese_text(text: str) -> str:
    """Clean and normalize Vietnamese text while preserving diacritics"""
    if not text:
        return ""
    
    # Strip whitespace and normalize
    text = text.strip()
    
    # Remove parenthetical annotations (including Chinese characters, explanations, etc.)
    # Matches: (content), [content], （content）
    text = re.sub(r'[(\[（][^)\]）]*[)\]）]', '', text)
    
    # SIMPLIFIED emoji removal - only target specific problematic emojis
    # Remove only clear emojis that are not Vietnamese text
    text = re.sub(r'[👉👈👆👇→←↑↓➡️⬅️⬆️⬇️▶️◀️▲▼]', '', text)
    
    # Remove specific emoji ranges that don't conflict with Vietnamese
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons  
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags (iOS)
        "]+", flags=re.UNICODE)
    text = emoji_pattern.sub('', text)
    
    # Normalize multiple whitespace to single space
    text = re.sub(r'\s+', ' ', text)
    
    # Clean up spacing around punctuation
    text = re.sub(r'\s*([.!?…,;:])\s*', r'\1 ', text)
    
    # Remove extra spaces at beginning of lines
    text = re.sub(r'^\s+', '', text, flags=re.MULTILINE)
    
    # Remove trailing spaces and clean up final result
    text = re.sub(r'\s+$', '', text)
    text = text.strip()
    
    return text

def split_vietnamese_sentences(text: str) -> List[str]:
    """Split Vietnamese text into sentences for optimal processing (based on refer/simple-index.py)"""
    if not text:
        return []
    
    # Split on sentence boundaries while preserving punctuation
    sentence_endings = r'(?<=[.!?…])\s+'
    parts = [p.strip() for p in re.split(sentence_endings, text) if p.strip()]
    
    # Handle edge case where text doesn't end with punctuation
    if not parts:
        parts = [text]
    elif not re.search(r'[.!?…]$', parts[-1]):
        # Add period to last sentence if missing
        parts[-1] += '.'
    
    # Filter out sentences that are too short or only punctuation (fixes conv1d kernel error)
    filtered_parts = []
    for part in parts:
        # Remove sentences that are just punctuation or have less than 3 characters of actual text
        text_only = re.sub(r'[.!?…\s]', '', part)
        if len(text_only) >= 3:  # Minimum 3 characters for vocoder to work
            filtered_parts.append(part)
        else:
            print(f"[SKIP] Sentence too short for TTS: '{part}'")
    
    # If all sentences were filtered out, keep at least one meaningful sentence
    if not filtered_parts and parts:
        # Find the longest sentence or add a default
        longest = max(parts, key=lambda x: len(re.sub(r'[.!?…\s]', '', x)))
        if len(re.sub(r'[.!?…\s]', '', longest)) > 0:
            filtered_parts = [longest]
        else:
            filtered_parts = ["Xin chào."]  # Default Vietnamese phrase
    
    print(f"[INFO] Split into {len(filtered_parts)} sentences for processing")
    return filtered_parts

def create_doing_directory() -> str:
    """Create timestamped directory in DOING folder for processing"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    doing_dir = f"{DOING_DIR}/{timestamp}"
    os.makedirs(doing_dir, exist_ok=True)
    print(f"[INFO] Created processing directory: {doing_dir}")
    return doing_dir

def cleanup_old_doing_folders():
    """Clean up DOING folders older than 8 hours to prevent memory overflow"""
    if not os.path.exists(DOING_DIR):
        return
    
    # Calculate cutoff date (8 hours ago)
    cutoff_date = datetime.datetime.now() - datetime.timedelta(hours=8)
    
    try:
        for item in os.listdir(DOING_DIR):
            item_path = os.path.join(DOING_DIR, item)
            
            if os.path.isdir(item_path):
                try:
                    # Parse timestamp from folder name (format: YYYY-MM-DD_HH-MM-SS)
                    folder_time = datetime.datetime.strptime(item, "%Y-%m-%d_%H-%M-%S")
                    
                    # Delete if older than cutoff
                    if folder_time < cutoff_date:
                        shutil.rmtree(item_path, ignore_errors=True)
                        print(f"[INFO] Cleaned up old processing folder: {item_path}")
                        
                except ValueError:
                    # Skip folders with invalid timestamp format
                    continue
                    
    except Exception as e:
        print(f"[WARN] Failed to cleanup old DOING folders: {e}")

def build_vietnamese_tsv(out_dir: str, prompt_text: str, prompt_wav: str, sentences: List[str]) -> str:
    """Generate TSV file for ZipVoice batch processing (based on refer/simple-index.py)"""
    tsv_path = f"{out_dir}/vietnamese_test.tsv"
    
    try:
        with open(tsv_path, "w", encoding="utf-8", newline="") as f:
            for i, sentence in enumerate(sentences, 1):
                # Clean sentence text
                clean_sentence = clean_vietnamese_text(sentence)
                if not clean_sentence:
                    continue
                
                segment_name = f"seg_{i:03d}"
                
                # Format: name<TAB>prompt_text<TAB>prompt_wav<TAB>target_text
                tsv_line = "\t".join([
                    segment_name,
                    prompt_text,
                    prompt_wav,
                    clean_sentence
                ]) + "\n"
                
                f.write(tsv_line)
        
        # Validate TSV format
        with open(tsv_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        if not lines:
            raise Exception("TSV file is empty")
        
        # Check format integrity
        invalid_lines = []
        for line_num, line in enumerate(lines, 1):
            columns = line.strip().split("\t")
            if len(columns) != 4:
                invalid_lines.append((line_num, len(columns)))
        
        if invalid_lines:
            error_details = ", ".join([f"line {ln}: {cols} cols" for ln, cols in invalid_lines[:3]])
            raise Exception(f"TSV format error - {error_details}")
        
        print(f"[SUCCESS] Created Vietnamese TSV with {len(lines)} sentences: {tsv_path}")
        return tsv_path
        
    except (IOError, UnicodeError) as e:
        raise Exception(f"Failed to create TSV file: {str(e)}")

def vietnamese_sentence_inference(out_dir: str, tsv_path: str, total_sentences: int = 0) -> None:
    """Execute Vietnamese TTS inference using ZipVoice defaults (no advanced parameters)"""
    
    # Validate inputs
    if not os.path.exists(tsv_path):
        raise FileNotFoundError(f"TSV file not found: {tsv_path}")
    
    if not os.path.exists(MODEL_DIR):
        raise FileNotFoundError(f"Vietnamese model directory not found: {MODEL_DIR}")
    
    checkpoint_path = os.path.join(MODEL_DIR, CHECKPOINT_NAME)
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Vietnamese checkpoint not found: {checkpoint_path}")
    
    # Read sentences from TSV for display
    sentences_to_process = []
    try:
        with open(tsv_path, "r", encoding="utf-8") as f:
            for line in f:
                columns = line.strip().split("\t")
                if len(columns) >= 4:
                    sentences_to_process.append((columns[0], columns[3]))  # (segment_name, sentence)
    except Exception as e:
        print(f"[WARN] Could not read sentences from TSV for display: {e}")
    
    # Set up environment for Vietnamese processing
    env = os.environ.copy()
    env.update({
        "LANG": "C.UTF-8",
        "LC_ALL": "C.UTF-8",
        "PYTHONIOENCODING": "utf-8"
    })
    
    # Construct ZipVoice command with ONLY default parameters (no advanced settings)
    cmd = [
        "python3", "-m", "zipvoice.bin.infer_zipvoice",
        "--model-name", ZIPVOICE_DEFAULTS["model_name"],
        "--model-dir", ZIPVOICE_DEFAULTS["model_dir"],
        "--checkpoint-name", ZIPVOICE_DEFAULTS["checkpoint_name"],
        "--tokenizer", ZIPVOICE_DEFAULTS["tokenizer"],
        "--lang", ZIPVOICE_DEFAULTS["lang"],
        "--test-list", tsv_path,
        "--res-dir", out_dir
    ]
    
    # Log each sentence being processed
    for i, (segment_name, sentence) in enumerate(sentences_to_process, 1):
        print(f"[SENTENCE] Processing {i}/{len(sentences_to_process)}: {sentence[:50]}{'...' if len(sentence) > 50 else ''}")
    
    print(f"[INFO] Starting Vietnamese TTS inference with ZipVoice defaults")
    
    try:
        # Use monitoring version with longer timeout for sentence processing
        # Calculate timeout based on number of sentences (30 seconds per sentence minimum)
        sentence_timeout = max(300, len(sentences_to_process) * 30)
        print(f"[INFO] Setting timeout to {sentence_timeout} seconds for {len(sentences_to_process)} sentences")
        run_command_with_monitoring(cmd, timeout=sentence_timeout, cwd=ZIPVOICE_DIR, env=env)
        print(f"[SUCCESS] Vietnamese TTS inference completed successfully")
        
    except Exception as e:
        error_msg = f"Vietnamese TTS inference failed: {str(e)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(500, error_msg)

def merge_vietnamese_segments(out_dir: str) -> str:
    """Merge generated audio segments into final Vietnamese speech output"""
    
    # Find all generated segment files
    segment_pattern = "seg_*.wav"
    wav_files = sorted(Path(out_dir).glob(segment_pattern))
    
    if not wav_files:
        raise Exception(f"No audio segments found in {out_dir}")
    
    print(f"[INFO] Merging {len(wav_files)} Vietnamese audio segments with natural pauses")
    
    # Process and concatenate segments with pauses
    sample_rate = None
    audio_chunks = []
    pause_duration = 0.5  # 500ms pause between sentences for natural speech flow
    
    for i, wav_file in enumerate(wav_files):
        try:
            audio_data, sr = sf.read(str(wav_file))
            
            # Validate sample rate consistency
            if sample_rate is None:
                sample_rate = sr
                # Create pause silence array once we know the sample rate
                pause_samples = int(pause_duration * sample_rate)
                pause_silence = np.zeros(pause_samples, dtype=audio_data.dtype)
                print(f"[INFO] Adding {pause_duration}s pauses between sentences ({pause_samples} samples at {sample_rate}Hz)")
            elif sr != sample_rate:
                raise Exception(f"Sample rate mismatch: {wav_file} has {sr}Hz, expected {sample_rate}Hz")
            
            # Convert stereo to mono if necessary
            if audio_data.ndim == 2:
                audio_data = audio_data[:, 0]
            
            # Validate audio data
            if len(audio_data) == 0:
                print(f"[WARN] Empty audio segment: {wav_file}")
                continue
            
            # Add the audio segment
            audio_chunks.append(audio_data)
            
            # Add pause after each segment except the last one
            if i < len(wav_files) - 1:
                audio_chunks.append(pause_silence.copy())
                print(f"[PAUSE] Added {pause_duration}s pause after segment {i+1}/{len(wav_files)}")
            
        except Exception as e:
            print(f"[WARN] Failed to process segment {wav_file}: {e}")
            continue
    
    if not audio_chunks:
        raise Exception("No valid audio segments to merge")
    
    # Concatenate all segments with pauses
    final_audio = np.concatenate(audio_chunks)
    
    # Normalize audio level
    if len(final_audio) > 0:
        max_val = np.max(np.abs(final_audio))
        if max_val > 0:
            final_audio = final_audio / max_val * 0.95  # Prevent clipping
    
    # Save final Vietnamese audio
    final_path = f"{out_dir}/vietnamese_final.wav"
    sf.write(final_path, final_audio, sample_rate)
    
    # Verify output file
    if not os.path.exists(final_path) or os.path.getsize(final_path) == 0:
        raise Exception("Failed to create final audio file")
    
    # Calculate total duration for logging
    total_duration = len(final_audio) / sample_rate
    audio_duration = total_duration - (len(wav_files) - 1) * pause_duration
    pause_duration_total = (len(wav_files) - 1) * pause_duration
    
    print(f"[SUCCESS] Created final Vietnamese audio: {final_path} ({len(wav_files)} segments)")
    print(f"[INFO] Total duration: {total_duration:.2f}s (audio: {audio_duration:.2f}s, pauses: {pause_duration_total:.2f}s)")
    return final_path

# === API ENDPOINTS === #

@app.get("/", summary="API Health Check")
def root():
    """API health check and information endpoint for version 2"""
    return {
        "message": "Premium Vietnamese TTS API - Version 2",
        "version": "2.0.0",
        "status": "active",
        "features": [
            "Sentence-by-sentence processing",
            "GPU temperature monitoring",
            "Performance metrics tracking",
            "Emergency stop functionality",
            "ZipVoice defaults only (no advanced settings)"
        ]
    }

@app.get("/gpu_status", response_model=GPUStatus, summary="Get GPU Status")
def get_gpu_status_endpoint():
    """Get current GPU temperature, utilization and memory status"""
    return get_gpu_status()

@app.get("/render_status", response_model=RenderStatus, summary="Get Render Status")
def get_render_status():
    """Get current rendering status for progress tracking"""
    # This would be updated during actual rendering
    return RenderStatus(
        is_rendering=process_controller.current_process is not None,
        current_sentence=0,
        total_sentences=0,
        estimated_time_remaining=0.0,
        elapsed_time=0.0
    )

@app.post("/stop_render", summary="Stop Current Rendering")
def stop_render():
    """Emergency stop for current rendering process"""
    process_controller.stop_current_process()
    return {"message": "Rendering process stopped", "success": True}

@app.get("/performance_metrics", summary="Get Performance Metrics")
def get_performance_metrics():
    """Get rendering performance statistics"""
    stats = render_metrics.get_stats()
    return {
        "message": "Performance metrics",
        "data": stats
    }

@app.get("/recent_renders", summary="Get Recent Render History")
def get_recent_renders_endpoint(page: int = 1, per_page: int = 10):
    """Get paginated list of recent renders from last 8 hours"""
    try:
        result = get_recent_renders(page, per_page)
        return {
            "message": "Recent render history",
            "data": result["records"],
            "pagination": result["pagination"]
        }
    except Exception as e:
        print(f"[ERROR] Failed to get recent renders: {e}")
        raise HTTPException(500, "Failed to retrieve render history")

@app.get("/render_file/{record_id}", summary="Download Render Audio File")
def download_render_file(record_id: str):
    """Download audio file from a specific render record"""
    try:
        data_log = load_data_log()
        record = next((r for r in data_log if r["id"] == record_id), None)
        
        if not record:
            raise HTTPException(404, f"Render record '{record_id}' not found")
        
        audio_path = record["audio_path"]
        if not os.path.exists(audio_path):
            raise HTTPException(404, f"Audio file not found: {audio_path}")
        
        return FileResponse(
            audio_path,
            media_type="audio/wav",
            filename=f"render_{record_id}.wav"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to download render file: {e}")
        raise HTTPException(500, "Failed to download audio file")

@app.get("/profiles", response_model=Dict[str, ProfileResponse], summary="List Voice Profiles")
def get_profiles():
    """Retrieve all available voice profiles with metadata"""
    try:
        profiles = load_profiles()
        return profiles
    except Exception as e:
        print(f"[ERROR] Failed to load profiles: {e}")
        raise HTTPException(500, "Failed to retrieve voice profiles")

@app.post("/profiles", summary="Create Voice Profile")
def create_profile(
    name: str = Form(..., description="Unique profile identifier"),
    display_name: str = Form(..., description="Human-readable profile name"),
    description: str = Form("", description="Profile description"),
    sample_text: str = Form(..., description="Exact transcript of sample audio"),
    sample_wav: UploadFile = File(..., description="Voice sample audio file")
):
    """Create a new voice profile with sample audio and transcript"""
    
    # Validate inputs
    if not name or not display_name or not sample_text:
        raise HTTPException(400, "Missing required fields: name, display_name, sample_text")
    
    # Validate profile name format
    if not re.match(r'^[a-zA-Z0-9_-]+$', name):
        raise HTTPException(400, "Profile name must contain only letters, numbers, hyphens, and underscores")
    
    # Validate audio file
    if not sample_wav.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.flac')):
        raise HTTPException(400, "Audio file must be WAV, MP3, M4A, or FLAC format")
    
    # Check if profile already exists
    profiles = load_profiles()
    if name in profiles:
        raise HTTPException(400, f"Profile '{name}' already exists")
    
    # Create profile directory
    profile_dir = Path(DATA_DIR) / name
    
    try:
        profile_dir.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded audio file
        audio_path = profile_dir / "sample.wav"
        with open(audio_path, "wb") as f:
            shutil.copyfileobj(sample_wav.file, f)
        
        # Save text files with proper UTF-8 encoding
        sample_txt_path = profile_dir / "sample.txt"
        with open(sample_txt_path, "w", encoding="utf-8") as f:
            f.write(clean_vietnamese_text(sample_text))
        
        input_txt_path = profile_dir / "input.txt"
        with open(input_txt_path, "w", encoding="utf-8") as f:
            f.write(clean_vietnamese_text(sample_text))
        
        # Update profiles metadata
        profiles[name] = {
            "name": display_name,
            "description": description or f"Custom voice profile - {display_name}",
            "path": str(profile_dir),
            "is_default": False,
            "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        save_profiles(profiles)
        
        print(f"[INFO] Created voice profile '{name}' at {profile_dir}")  # Only INFO log for profile creation
        return {
            "message": f"Voice profile '{name}' created successfully",
            "profile_id": name,
            "path": str(profile_dir)
        }
        
    except Exception as e:
        # Cleanup on error
        if profile_dir.exists():
            shutil.rmtree(profile_dir, ignore_errors=True)
        
        error_msg = f"Failed to create profile '{name}': {str(e)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(500, error_msg)

@app.delete("/profiles/{profile_id}", summary="Delete Voice Profile")
def delete_profile(profile_id: str):
    """Delete a voice profile (protected against deleting default profiles)"""
    
    profiles = load_profiles()
    
    if profile_id not in profiles:
        raise HTTPException(404, f"Profile '{profile_id}' not found")
    
    profile_info = profiles[profile_id]
    
    # Protect default profiles
    if profile_info.get("is_default", False):
        raise HTTPException(400, f"Cannot delete default profile '{profile_id}'")
    
    try:
        # Remove profile directory
        profile_dir = Path(profile_info["path"])
        if profile_dir.exists():
            shutil.rmtree(profile_dir)
        
        # Remove from metadata
        del profiles[profile_id]
        save_profiles(profiles)
        
        print(f"[SUCCESS] Deleted profile '{profile_id}'")
        return {"message": f"Profile '{profile_id}' deleted successfully"}
        
    except Exception as e:
        error_msg = f"Failed to delete profile '{profile_id}': {str(e)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(500, error_msg)

@app.post("/synthesize_speech", summary="Generate Vietnamese Speech - Version 2")
def synthesize_speech_v2(
    profile_id: Optional[str] = Form(None, description="Voice profile ID (optional, uses default if not provided)"),
    text: str = Form(..., description="Vietnamese text to synthesize (unlimited length)")
):
    """
    Generate high-quality Vietnamese speech using sentence-by-sentence processing.
    
    Version 2 features:
    - Sentence-by-sentence processing (no length limits)
    - GPU temperature monitoring and throttling
    - Performance metrics tracking
    - Emergency stop capability
    - ZipVoice defaults only (no advanced settings)
    """
    
    # Reset process controller for new render
    process_controller.reset()
    
    # Use default profile if none specified
    active_profile = profile_id or DEFAULT_PROFILE
    
    # Validate text input
    if not text or not text.strip():
        raise HTTPException(400, "Text input cannot be empty")
    
    # Clean and validate Vietnamese text
    vietnamese_text = clean_vietnamese_text(text)
    if not vietnamese_text:
        raise HTTPException(400, "No valid Vietnamese text provided")
    
    # Count words for performance metrics
    words = vietnamese_text.split()
    word_count = len(words)
    
    # Validate profile exists
    profiles = load_profiles()
    if active_profile not in profiles:
        raise HTTPException(404, f"Voice profile '{active_profile}' not found")
    
    # Get profile information
    profile_info = profiles[active_profile]
    profile_dir = Path(profile_info["path"])
    sample_txt_path = profile_dir / "sample.txt"
    sample_wav_path = profile_dir / "sample.wav"
    
    # Validate profile files
    if not sample_txt_path.exists() or not sample_wav_path.exists():
        raise HTTPException(400, f"Profile '{active_profile}' is missing required files")
    
    # Create timestamped directory in DOING folder
    doing_dir = create_doing_directory()
    
    # Clean up old processing folders (older than 2 days)
    cleanup_old_doing_folders()
    
    start_time = time.time()
    
    try:
        # Version 2 synthesis started
        print(f"[INFO] Profile: {active_profile}, Text: {word_count} words")  # Single INFO log for synthesis
        
        # Step 1: Read prompt text
        with open(sample_txt_path, "r", encoding="utf-8") as f:
            prompt_text = clean_vietnamese_text(f.read())
        
        if not prompt_text:
            raise HTTPException(400, f"Profile '{active_profile}' has empty sample text")
        
        # Step 2: Convert sample audio to 24kHz mono
        prompt_wav_24k = ensure_prompt_wav(str(sample_wav_path), doing_dir)
        
        # Step 3: Split Vietnamese text into sentences for processing
        sentences = split_vietnamese_sentences(vietnamese_text)
        if not sentences:
            raise HTTPException(400, "Unable to process Vietnamese text into sentences")
        
        # Split into sentences
        print(f"[INFO] Processing {len(sentences)} Vietnamese sentences")
        
        # Step 4: Create TSV file for batch processing
        tsv_path = build_vietnamese_tsv(doing_dir, prompt_text, prompt_wav_24k, sentences)
        
        # Step 5: Run Vietnamese TTS inference with monitoring and sentence display
        vietnamese_sentence_inference(doing_dir, tsv_path, len(sentences))
        
        # Check if process was stopped
        if process_controller.is_stopped():
            raise HTTPException(409, "Rendering was stopped by user")
        
        # Step 6: Merge audio segments
        final_audio_path = merge_vietnamese_segments(doing_dir)
        
        # Step 7: Copy final result to the processing directory for preservation
        preserved_result = f"{doing_dir}/final_result.wav"
        shutil.copy2(final_audio_path, preserved_result)
        print(f"[MERGE] Final audio preserved at: {preserved_result}")
        
        # Verify final output
        if not os.path.exists(final_audio_path):
            raise HTTPException(500, "Failed to generate Vietnamese audio output")
        
        # Validate audio file
        try:
            audio_data, sample_rate = sf.read(final_audio_path)
            if len(audio_data) == 0:
                raise Exception("Generated audio file is empty")
        except Exception as e:
            raise HTTPException(500, f"Generated audio file is corrupted: {str(e)}")
        
        # Record performance metrics
        render_time = time.time() - start_time
        render_metrics.add_render(word_count, render_time)
        
        # Add render record to data log for history tracking
        add_render_record(
            text=vietnamese_text,
            profile_id=active_profile,
            audio_path=preserved_result,  # Use the preserved path
            word_count=word_count,
            processing_time=render_time
        )
        
        # Return audio file
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"vietnamese_speech_v2_{active_profile}_{timestamp}.wav"
        return FileResponse(
            final_audio_path,
            media_type="audio/wav",
            filename=filename,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "X-Profile-Used": active_profile,
                "X-Synthesis-Time": timestamp,
                "X-Audio-Duration": f"{len(audio_data) / sample_rate:.2f}s",
                "X-Render-Time": f"{render_time:.2f}s",
                "X-Word-Count": str(word_count),
                "X-Performance": f"{render_time/word_count:.2f}s/word"
            }
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
        
    except Exception as e:
        error_msg = f"Vietnamese TTS synthesis failed: {str(e)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(500, error_msg)
    
    finally:
        # Clean up process controller
        process_controller.reset()


# === APPLICATION STARTUP === #

if __name__ == "__main__":
    import uvicorn
    
    print("Starting Premium Vietnamese TTS API Version 2...")
    
    # Keep access logs quiet but allow error logs
    logging.getLogger("uvicorn.access").disabled = True
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info",         # Allow error and info logs for debugging
        access_log=False,         # Disable access logs completely
        use_colors=False          # Disable colors for cleaner logs
    )
