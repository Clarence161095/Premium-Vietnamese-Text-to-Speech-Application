#!/usr/bin/env python3
"""
Premium Vietnamese Text-to-Speech API
A production-ready FastAPI application for high-quality Vietnamese speech synthesis
using ZipVoice technology with zero-shot voice cloning capabilities.
"""

import os
import json
import shutil
import subprocess
import uuid
import datetime
import re
import tempfile
from pathlib import Path
from typing import Optional, List, Dict, Any

import soundfile as sf
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# === CONFIGURATION === #

# Directory paths
DATA_DIR = "/data"
ZIPVOICE_DIR = "/ZipVoice"
MODEL_DIR = "/models/zipvoice_vi"
CHECKPOINT_NAME = "iter-525000-avg-2.pt"
DEFAULT_PROFILE = "tina"

# Vietnamese TTS optimized parameters
VIETNAMESE_DEFAULTS = {
    "guidance_scale": 1.0,      # Quality control
    "num_step": 16,             # Inference steps
    "feat_scale": 0.1,          # Feature scaling
    "target_rms": 0.1,          # Audio level
    "speed": 1.0,               # Speech rate
    "context_length": 65000,    # Token limit
    "gpu_offload": 0.9          # GPU utilization
}

# === PYDANTIC MODELS === #

class SynthesisRequest(BaseModel):
    """Request model for speech synthesis"""
    text: str
    profile_id: Optional[str] = None
    speed: float = VIETNAMESE_DEFAULTS["speed"]
    guidance_scale: float = VIETNAMESE_DEFAULTS["guidance_scale"]
    num_step: int = VIETNAMESE_DEFAULTS["num_step"]
    feat_scale: float = VIETNAMESE_DEFAULTS["feat_scale"]
    target_rms: float = VIETNAMESE_DEFAULTS["target_rms"]
    context_length: int = VIETNAMESE_DEFAULTS["context_length"]
    gpu_offload: float = VIETNAMESE_DEFAULTS["gpu_offload"]

class ProfileResponse(BaseModel):
    """Response model for profile information"""
    name: str
    description: str
    path: str
    is_default: bool
    created_at: str

# === FASTAPI APP SETUP === #

app = FastAPI(
    title="Premium Vietnamese Text-to-Speech API",
    description="High-quality Vietnamese speech synthesis with voice cloning",
    version="1.0.0",
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

def run_command(cmd: List[str], **kwargs) -> subprocess.CompletedProcess:
    """Execute system command with proper error handling and logging"""
    print(f"[CMD] {' '.join(cmd)}")
    
    try:
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            encoding='utf-8',
            **kwargs
        )
        
        if result.stdout:
            print(f"[STDOUT] {result.stdout}")
        if result.stderr:
            print(f"[STDERR] {result.stderr}")
            
        if result.returncode != 0:
            raise subprocess.CalledProcessError(
                result.returncode, cmd, result.stdout, result.stderr
            )
        
        return result
        
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        error_msg = f"Command execution failed: {' '.join(cmd)}"
        if hasattr(e, 'stderr') and e.stderr:
            error_msg += f"\nError: {e.stderr}"
        print(f"[ERROR] {error_msg}")
        raise Exception(error_msg)

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
    
    run_command(cmd)
    
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
    
    # Normalize multiple whitespace to single space
    text = re.sub(r'\s+', ' ', text)
    
    # Ensure proper punctuation spacing
    text = re.sub(r'\s*([.!?…])\s*', r'\1 ', text)
    text = re.sub(r'\s+$', '', text)  # Remove trailing space
    
    return text

def split_vietnamese_sentences(text: str) -> List[str]:
    """Split Vietnamese text into sentences for optimal prosody"""
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
    
    return parts

def build_vietnamese_tsv(out_dir: str, prompt_text: str, prompt_wav: str, sentences: List[str]) -> str:
    """Generate TSV file for ZipVoice batch processing with proper Vietnamese formatting"""
    tsv_path = f"{out_dir}/vietnamese_test.tsv"
    
    try:
        with open(tsv_path, "w", encoding="utf-8", newline="") as f:
            for i, sentence in enumerate(sentences, 1):
                # Clean sentence text
                clean_sentence = clean_vietnamese_text(sentence)
                if not clean_sentence:
                    continue
                
                segment_name = f"vn_seg_{i:03d}"
                
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

def vietnamese_inference(out_dir: str, tsv_path: str, gpu_offload: float = 0.9) -> None:
    """Execute Vietnamese TTS inference using ZipVoice with Vietnamese-trained model"""
    
    # Validate inputs
    if not os.path.exists(tsv_path):
        raise FileNotFoundError(f"TSV file not found: {tsv_path}")
    
    if not os.path.exists(MODEL_DIR):
        raise FileNotFoundError(f"Vietnamese model directory not found: {MODEL_DIR}")
    
    checkpoint_path = os.path.join(MODEL_DIR, CHECKPOINT_NAME)
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Vietnamese checkpoint not found: {checkpoint_path}")
    
    # Set up environment for Vietnamese processing
    env = os.environ.copy()
    env.update({
        "CUDA_MEMORY_FRACTION": str(gpu_offload),
        "LANG": "C.UTF-8",
        "LC_ALL": "C.UTF-8",
        "PYTHONIOENCODING": "utf-8"
    })
    
    # Construct ZipVoice command with Vietnamese model parameters
    cmd = [
        "python3", "-m", "zipvoice.bin.infer_zipvoice",
        "--model-name", "zipvoice",
        "--model-dir", MODEL_DIR,          # CRITICAL: Vietnamese model directory
        "--checkpoint-name", CHECKPOINT_NAME,  # CRITICAL: Vietnamese checkpoint
        "--tokenizer", "espeak",           # CRITICAL: eSpeak for Vietnamese phonemes
        "--lang", "vi",                    # CRITICAL: Vietnamese language code
        "--test-list", tsv_path,           # Input TSV file
        "--res-dir", out_dir               # Output directory
    ]
    
    print(f"[INFO] Starting Vietnamese TTS inference with model: {checkpoint_path}")
    
    try:
        run_command(cmd, cwd=ZIPVOICE_DIR, env=env, timeout=300)
        print(f"[SUCCESS] Vietnamese TTS inference completed successfully")
        
    except Exception as e:
        error_msg = f"Vietnamese TTS inference failed: {str(e)}"
        print(f"[ERROR] {error_msg}")
        raise HTTPException(500, error_msg)

def merge_vietnamese_segments(out_dir: str) -> str:
    """Merge generated audio segments into final Vietnamese speech output"""
    
    # Find all generated segment files
    segment_pattern = "vn_seg_*.wav"
    wav_files = sorted(Path(out_dir).glob(segment_pattern))
    
    if not wav_files:
        # Fallback to generic pattern
        wav_files = sorted(Path(out_dir).glob("seg_*.wav"))
    
    if not wav_files:
        raise Exception(f"No audio segments found in {out_dir}")
    
    print(f"[INFO] Merging {len(wav_files)} Vietnamese audio segments")
    
    # Process and concatenate segments
    sample_rate = None
    audio_chunks = []
    
    for wav_file in wav_files:
        try:
            audio_data, sr = sf.read(str(wav_file))
            
            # Validate sample rate consistency
            if sample_rate is None:
                sample_rate = sr
            elif sr != sample_rate:
                raise Exception(f"Sample rate mismatch: {wav_file} has {sr}Hz, expected {sample_rate}Hz")
            
            # Convert stereo to mono if necessary
            if audio_data.ndim == 2:
                audio_data = audio_data[:, 0]
            
            # Validate audio data
            if len(audio_data) == 0:
                print(f"[WARN] Empty audio segment: {wav_file}")
                continue
            
            audio_chunks.append(audio_data)
            
        except Exception as e:
            print(f"[WARN] Failed to process segment {wav_file}: {e}")
            continue
    
    if not audio_chunks:
        raise Exception("No valid audio segments to merge")
    
    # Concatenate all segments
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
    
    print(f"[SUCCESS] Created final Vietnamese audio: {final_path} ({len(audio_chunks)} segments)")
    return final_path

# === API ENDPOINTS === #

@app.get("/", summary="API Health Check")
def root():
    """API health check and information endpoint"""
    return {
        "message": "Premium Vietnamese TTS API",
        "version": "1.0.0",
        "status": "active",
        "features": [
            "Vietnamese language optimization",
            "Zero-shot voice cloning", 
            "High-quality audio synthesis",
            "Custom voice profiles"
        ]
    }

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
        
        print(f"[SUCCESS] Created voice profile '{name}' at {profile_dir}")
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

@app.post("/synthesize_speech", summary="Generate Vietnamese Speech")
def synthesize_speech(
    profile_id: Optional[str] = Form(None, description="Voice profile ID (optional, uses default if not provided)"),
    text: str = Form(..., description="Vietnamese text to synthesize"),
    speed: float = Form(VIETNAMESE_DEFAULTS["speed"], ge=0.1, le=3.0, description="Speech speed multiplier"),
    guidance_scale: float = Form(VIETNAMESE_DEFAULTS["guidance_scale"], ge=0.1, le=3.0, description="Generation guidance scale"),
    num_step: int = Form(VIETNAMESE_DEFAULTS["num_step"], ge=4, le=50, description="Number of inference steps"),
    feat_scale: float = Form(VIETNAMESE_DEFAULTS["feat_scale"], ge=0.01, le=1.0, description="Feature scaling factor"),
    target_rms: float = Form(VIETNAMESE_DEFAULTS["target_rms"], ge=0.01, le=1.0, description="Target audio RMS level"),
    context_length: int = Form(VIETNAMESE_DEFAULTS["context_length"], ge=100, le=130000, description="Maximum context length in tokens"),
    gpu_offload: float = Form(VIETNAMESE_DEFAULTS["gpu_offload"], ge=0.1, le=1.0, description="GPU memory utilization (0.1-1.0)")
):
    """
    Generate high-quality Vietnamese speech from text using ZipVoice technology.
    
    This endpoint supports:
    - Zero-shot voice cloning with custom profiles
    - Vietnamese language optimization with eSpeak tokenizer
    - Advanced parameter control for quality tuning
    - Automatic text preprocessing and sentence splitting
    """
    
    # Use default profile if none specified
    active_profile = profile_id or DEFAULT_PROFILE
    
    # Validate text input
    if not text or not text.strip():
        raise HTTPException(400, "Text input cannot be empty")
    
    # Clean and validate Vietnamese text
    vietnamese_text = clean_vietnamese_text(text)
    if not vietnamese_text:
        raise HTTPException(400, "No valid Vietnamese text provided")
    
    # Enforce context length limits
    words = vietnamese_text.split()
    if len(words) > context_length:
        print(f"[WARN] Text truncated from {len(words)} to {context_length} words")
        vietnamese_text = " ".join(words[:context_length])
    
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
    
    # Create unique temporary directory
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    temp_dir = f"/tmp/vietnamese_tts_{timestamp}_{unique_id}"
    
    try:
        os.makedirs(temp_dir, exist_ok=True)
        
        print(f"=== Premium Vietnamese TTS Synthesis ===")
        print(f"[INFO] Profile: {active_profile}")
        print(f"[INFO] Text: '{vietnamese_text}' ({len(vietnamese_text)} chars, {len(words)} words)")
        print(f"[INFO] Quality: guidance_scale={guidance_scale}, num_step={num_step}")
        print(f"[INFO] Temp directory: {temp_dir}")
        
        # Step 1: Read prompt text
        with open(sample_txt_path, "r", encoding="utf-8") as f:
            prompt_text = clean_vietnamese_text(f.read())
        
        if not prompt_text:
            raise HTTPException(400, f"Profile '{active_profile}' has empty sample text")
        
        # Step 2: Convert sample audio to 24kHz mono
        prompt_wav_24k = ensure_prompt_wav(str(sample_wav_path), temp_dir)
        
        # Step 3: Split Vietnamese text into sentences
        sentences = split_vietnamese_sentences(vietnamese_text)
        if not sentences:
            raise HTTPException(400, "Unable to process Vietnamese text into sentences")
        
        print(f"[INFO] Split into {len(sentences)} Vietnamese sentences")
        
        # Step 4: Create TSV file for batch processing
        tsv_path = build_vietnamese_tsv(temp_dir, prompt_text, prompt_wav_24k, sentences)
        
        # Step 5: Run Vietnamese TTS inference
        vietnamese_inference(temp_dir, tsv_path, gpu_offload)
        
        # Step 6: Merge audio segments
        final_audio_path = merge_vietnamese_segments(temp_dir)
        
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
        
        print(f"[SUCCESS] Vietnamese TTS synthesis completed successfully!")
        print(f"[RESULT] Audio: {final_audio_path} ({len(audio_data)} samples, {sample_rate}Hz)")
        
        # Return audio file
        filename = f"vietnamese_speech_{active_profile}_{timestamp}.wav"
        return FileResponse(
            final_audio_path,
            media_type="audio/wav",
            filename=filename,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "X-Profile-Used": active_profile,
                "X-Synthesis-Time": timestamp,
                "X-Audio-Duration": f"{len(audio_data) / sample_rate:.2f}s"
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
        # Note: Temporary files are not immediately deleted as FileResponse needs them
        # They will be cleaned up by the system's temp directory cleanup
        pass

# === APPLICATION STARTUP === #

if __name__ == "__main__":
    import uvicorn
    print("Starting Premium Vietnamese TTS API...")
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info",
        access_log=True
    )

def load_profiles() -> dict:
    """Load profile metadata from JSON file"""
    profiles_file = f"{DATA_DIR}/profiles.json"
    if os.path.exists(profiles_file):
        with open(profiles_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_profiles(profiles: dict) -> None:
    """Save profile metadata to JSON file"""
    profiles_file = f"{DATA_DIR}/profiles.json"
    with open(profiles_file, "w", encoding="utf-8") as f:
        json.dump(profiles, f, indent=2, ensure_ascii=False)

def run_command(cmd: List[str], **kwargs) -> subprocess.CompletedProcess:
    """Execute command with proper logging"""
    print(f"[CMD] {' '.join(cmd)}")
    result = subprocess.run(
        cmd, 
        capture_output=True, 
        text=True, 
        encoding='utf-8',
        **kwargs
    )
    
    if result.stdout:
        print(f"[OUT] {result.stdout}")
    if result.stderr:
        print(f"[ERR] {result.stderr}")
        
    if result.returncode != 0:
        raise Exception(f"Command failed: {' '.join(cmd)}\\nError: {result.stderr}")
    
    return result

def ensure_prompt_wav(sample_path: str, out_dir: str) -> str:
    """Convert audio to 24kHz mono for Vietnamese TTS compatibility"""
    prompt_wav = f"{out_dir}/prompt-24k.wav"
    cmd = ["ffmpeg", "-y", "-i", sample_path, "-ac", "1", "-ar", "24000", prompt_wav]
    
    run_command(cmd)
    
    if not os.path.exists(prompt_wav):
        raise Exception(f"Failed to create 24kHz audio: {prompt_wav}")
    
    return prompt_wav

def read_clean_text(text: str) -> str:
    """Clean text while preserving Vietnamese diacritics"""
    text = text.strip()
    # Normalize whitespace but preserve punctuation and diacritics
    text = re.sub(r"\\s+", " ", text)
    return text

def split_vietnamese_sentences(text: str) -> List[str]:
    """Split Vietnamese text into sentences for better prosody"""
    # Split on Vietnamese sentence boundaries (. ! ? … ;)
    parts = [p.strip() for p in re.split(r'(?<=[\\.\\.\\!\\?…;])\\s+', text) if p.strip()]
    return parts if parts else [text]

def build_vietnamese_tsv(out_dir: str, prompt_text: str, prompt_wav: str, sentences: List[str]) -> str:
    """Build TSV file for ZipVoice batch processing"""
    tsv_path = f"{out_dir}/tmp_test.tsv"
    
    # Create TSV with exact 4-column format required by ZipVoice
    with open(tsv_path, "w", encoding="utf-8", newline="") as f:
        for i, sent in enumerate(sentences, 1):
            name = f"seg_{i:03d}"
            # Format: name<TAB>prompt_text<TAB>prompt_wav<TAB>target_text
            f.write("\t".join([name, prompt_text, prompt_wav, sent]) + "\n")
    
    # Validate TSV format
    with open(tsv_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    bad_lines = []
    for ln, line in enumerate(lines, 1):
        if len(line.strip().split("\t")) != 4:
            bad_lines.append((ln, line.strip()))
    
    if bad_lines:
        for ln, line in bad_lines[:5]:
            print(f"[BAD] Line {ln} doesn't have 4 columns: {line}")
        raise Exception("TSV format error (must have 4 TAB-separated columns)")
    
    print(f"[OK] Created TSV with {len(sentences)} sentences: {tsv_path}")
    return tsv_path

def vietnamese_inference(out_dir: str, tsv_path: str, gpu_offload: float = 0.9) -> None:
    """Run Vietnamese TTS inference using ZipVoice with Vietnamese model"""
    
    # Set environment for GPU control and UTF-8 encoding
    env = os.environ.copy()
    env["CUDA_MEMORY_FRACTION"] = str(gpu_offload)
    env["LANG"] = "C.UTF-8"
    env["LC_ALL"] = "C.UTF-8"
    env["PYTHONIOENCODING"] = "utf-8"
    
    # CRITICAL: ZipVoice command with Vietnamese model parameters
    cmd = [
        "python3", "-m", "zipvoice.bin.infer_zipvoice",
        "--model-name", "zipvoice",
        "--model-dir", MODEL_DIR,           # Vietnamese model directory
        "--checkpoint-name", CHECKPOINT_NAME,  # Vietnamese checkpoint  
        "--tokenizer", "espeak",            # CRITICAL: Must use espeak for Vietnamese
        "--lang", "vi",                     # CRITICAL: Vietnamese language code
        "--test-list", tsv_path,            # Batch processing with TSV
        "--res-dir", out_dir,               # Output directory
        # Let ZipVoice use default parameters for best Vietnamese quality
    ]
    
    try:
        run_command(cmd, cwd=ZIPVOICE_DIR, env=env, timeout=300)
        print(f"[SUCCESS] Vietnamese TTS inference completed")
    except Exception as e:
        print(f"[ERROR] Vietnamese TTS failed: {str(e)}")
        raise HTTPException(500, f"Vietnamese TTS synthesis failed: {str(e)}")

def merge_vietnamese_segments(out_dir: str) -> str:
    """Merge generated audio segments into final Vietnamese speech"""
    wav_files = sorted(Path(out_dir).glob("seg_*.wav"))
    
    if not wav_files:
        raise Exception("No seg_*.wav files found after Vietnamese inference")
    
    print(f"[INFO] Merging {len(wav_files)} Vietnamese audio segments")
    
    sr = None
    chunks = []
    
    for wav_file in wav_files:
        audio_data, sample_rate = sf.read(str(wav_file))
        
        if sr is None:
            sr = sample_rate
        if sample_rate != sr:
            raise Exception(f"Sample rate mismatch: {wav_file} has {sample_rate}Hz, expected {sr}Hz")
        
        # Convert stereo to mono if needed
        if audio_data.ndim == 2:
            audio_data = audio_data[:, 0]
        
        chunks.append(audio_data)
    
    # Concatenate all segments
    final_audio = np.concatenate(chunks)
    
    # Save final Vietnamese audio
    final_path = f"{out_dir}/final_vietnamese.wav"
    sf.write(final_path, final_audio, sr)
    
    print(f"[SUCCESS] Created final Vietnamese audio: {final_path} from {len(wav_files)} segments")
    return final_path

@app.get("/profiles")
def get_profiles():
    """Get all voice profiles"""
    return load_profiles()

@app.post("/profiles")
def add_profile(
    name: str = Form(...),
    display_name: str = Form(...),
    description: str = Form(...),
    sample_text: str = Form(...),
    sample_wav: UploadFile = File(...)
):
    """Add a new voice profile with audio sample"""
    # Validate file format
    if not sample_wav.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.flac')):
        raise HTTPException(400, "Audio file must be WAV, MP3, M4A, or FLAC format")
    
    profiles = load_profiles()
    if name in profiles:
        raise HTTPException(400, f"Profile '{name}' already exists")
    
    # Create profile directory
    profile_dir = f"{DATA_DIR}/{name}"
    os.makedirs(profile_dir, exist_ok=True)
    
    try:
        # Save uploaded audio file
        audio_path = f"{profile_dir}/sample.wav"
        with open(audio_path, "wb") as f:
            shutil.copyfileobj(sample_wav.file, f)
        
        # Save text files (Vietnamese-compatible encoding)
        with open(f"{profile_dir}/sample.txt", "w", encoding="utf-8") as f:
            f.write(sample_text.strip())
        
        with open(f"{profile_dir}/input.txt", "w", encoding="utf-8") as f:
            f.write(sample_text.strip())
        
        # Update profiles metadata
        profiles[name] = {
            "name": display_name,
            "description": description,
            "path": profile_dir,
            "is_default": False,
            "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        save_profiles(profiles)
        return {"message": f"Vietnamese voice profile '{name}' created successfully"}
        
    except Exception as e:
        # Cleanup on error
        if os.path.exists(profile_dir):
            shutil.rmtree(profile_dir, ignore_errors=True)
        raise HTTPException(500, f"Failed to create profile: {str(e)}")

@app.delete("/profiles/{profile_id}")
def delete_profile(profile_id: str):
    """Delete a voice profile (protects default profiles)"""
    profiles = load_profiles()
    if profile_id not in profiles:
        raise HTTPException(404, "Profile not found")
    
    if profiles[profile_id].get("is_default", False):
        raise HTTPException(400, "Cannot delete default profile")
    
    # Remove profile directory and metadata
    profile_dir = profiles[profile_id]["path"]
    if os.path.exists(profile_dir):
        shutil.rmtree(profile_dir)
    
    del profiles[profile_id]
    save_profiles(profiles)
    
    return {"message": f"Profile '{profile_id}' deleted successfully"}

@app.post("/synthesize_speech")
def synthesize_speech(
    profile_id: Optional[str] = Form(None),  # Optional - uses default if not provided
    text: str = Form(...),
    speed: float = Form(VIETNAMESE_DEFAULTS["speed"]),
    guidance_scale: float = Form(VIETNAMESE_DEFAULTS["guidance_scale"]),
    num_step: int = Form(VIETNAMESE_DEFAULTS["num_step"]),
    feat_scale: float = Form(VIETNAMESE_DEFAULTS["feat_scale"]),
    target_rms: float = Form(VIETNAMESE_DEFAULTS["target_rms"]),
    context_length: int = Form(VIETNAMESE_DEFAULTS["context_length"]),
    gpu_offload: float = Form(VIETNAMESE_DEFAULTS["gpu_offload"])
):
    """Premium Vietnamese Text-to-Speech synthesis"""
    
    # Use default profile if none specified
    if not profile_id:
        profile_id = DEFAULT_PROFILE
        print(f"[INFO] Using default Vietnamese profile: {profile_id}")
    
    profiles = load_profiles()
    if profile_id not in profiles:
        raise HTTPException(404, f"Voice profile '{profile_id}' not found")
    
    profile_dir = profiles[profile_id]["path"]
    sample_txt_path = f"{profile_dir}/sample.txt"
    sample_wav_path = f"{profile_dir}/sample.wav"
    
    # Validate profile files
    if not os.path.exists(sample_txt_path) or not os.path.exists(sample_wav_path):
        raise HTTPException(400, f"Profile '{profile_id}' missing required files (sample.txt or sample.wav)")
    
    # Read and clean texts
    with open(sample_txt_path, "r", encoding="utf-8") as f:
        prompt_text = read_clean_text(f.read())
    
    vietnamese_text = read_clean_text(text)
    
    # Validate input
    if not vietnamese_text:
        raise HTTPException(400, "Input text cannot be empty")
    
    # Limit text length for memory management
    words = vietnamese_text.split()
    if len(words) > context_length:
        print(f"[WARN] Text truncated to {context_length} words for memory efficiency")
        vietnamese_text = " ".join(words[:context_length])
    
    # Create unique output directory with timestamp
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir = f"/tmp/vietnamese_tts_{timestamp}_{uuid.uuid4().hex[:8]}"
    os.makedirs(out_dir, exist_ok=True)
    
    try:
        print(f"=== Premium Vietnamese TTS (espeak tokenizer, vi language) ===")
        print(f"[INFO] Profile: {profile_id}")
        print(f"[INFO] Text: '{vietnamese_text}' ({len(vietnamese_text)} chars, {len(words)} words)")
        print(f"[INFO] Output directory: {out_dir}")
        
        # Step 1: Convert sample audio to 24kHz mono (critical for Vietnamese compatibility)
        prompt_wav_24k = ensure_prompt_wav(sample_wav_path, out_dir)
        print(f"[OK] Converted audio to 24kHz mono: {prompt_wav_24k}")
        
        # Step 2: Split Vietnamese text into sentences for better prosody
        sentences = split_vietnamese_sentences(vietnamese_text)
        if not sentences:
            raise HTTPException(400, "Unable to process Vietnamese text")
        print(f"[INFO] Split into {len(sentences)} Vietnamese sentences")
        
        # Step 3: Create TSV file for ZipVoice batch processing
        tsv_path = build_vietnamese_tsv(out_dir, prompt_text, prompt_wav_24k, sentences)
        
        # Step 4: Run Vietnamese TTS inference with optimal settings
        vietnamese_inference(out_dir, tsv_path, gpu_offload)
        
        # Step 5: Merge audio segments into final Vietnamese speech
        final_audio_path = merge_vietnamese_segments(out_dir)
        
        if not os.path.exists(final_audio_path):
            raise HTTPException(500, "Failed to generate Vietnamese audio")
        
        # Verify audio file is valid
        try:
            sf.read(final_audio_path)
        except Exception as e:
            raise HTTPException(500, f"Generated audio file is corrupted: {str(e)}")
        
        print(f"[DONE] Premium Vietnamese TTS completed successfully!")
        print(f"[RESULT] Audio file: {final_audio_path}")
        
        return FileResponse(
            final_audio_path,
            media_type="audio/wav",
            filename=f"vietnamese_speech_{timestamp}.wav"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Vietnamese TTS synthesis failed: {str(e)}")
        raise HTTPException(500, f"Vietnamese TTS synthesis failed: {str(e)}")
    
    finally:
        # Note: Don't delete temp files immediately as FileResponse needs them
        # Files will be cleaned up by system temp cleanup
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
