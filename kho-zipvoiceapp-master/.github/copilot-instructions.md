# ZipVoice Vietnamese TTS Application - AI Agent Instructions

## Architecture Overview

This is a **hybrid Next.js + Python TTS application** that provides a web interface for Vietnamese text-to-speech generation using the ZipVoice model.

### Key Components

- **Frontend**: Next.js 15 React app with TypeScript and Tailwind CSS
- **Python Backend**: ZipVoice TTS engine in `src/zipvoice/` (separate conda environment)  
- **API Bridge**: Next.js API routes spawn Python processes to execute TTS inference
- **Voice Management**: Persistent voice profiles stored in `voices/` directory
- **Text Processing**: Custom normalization and batching for long-form content

## Critical Development Patterns

### Python Integration Pattern
- API routes use `spawn()` to execute Python scripts 
- Python path: Uses `process.env.PYTHON_PATH` or `/usr/bin/python3` (for Docker)
- All Python execution happens in `src/zipvoice/` working directory
- **Never modify Python code** - only adjust paths and parameters

### Voice Management System
```typescript
// Voice metadata in voices/voices.json
type VoiceMeta = {
  name: string;
  promptText: string; 
  promptWav: string; // absolute file path
  createdAt: string;
}
```

### API Endpoints Structure
- `POST /api/tts` - Main TTS generation (expects voiceName + text)
- `GET /api/voices` - List saved voices
- `POST /api/voices` - Create new voice profile
- `PUT /api/voices/[name]` - Update voice profile
- `POST /api/merge` - Merge multiple audio files

### Text Processing Pipeline
1. Unicode normalization (`lib/normalize.ts`)
2. Smart quote conversion to ASCII
3. Custom dictionary mappings (word-level replacement)
4. Batch processing by newlines (configurable batch size)
5. Sound effect token replacement from `/soundeffect/` files

## File System Conventions

### Directory Structure
```
src/
├── app/api/          # Next.js API routes (Node.js)
├── zipvoice/         # Python TTS engine (DO NOT MODIFY)
└── lib/normalize.ts  # Text processing utilities

voices/               # Voice profiles storage
├── voices.json       # Voice metadata
└── *.wav            # Voice prompt files

public/soundeffect/   # Sound effect files for token replacement
```

### Critical Paths
- Model files: `/app/src/zipvoice/exp/` (in Docker) or local `src/zipvoice/exp/`
- Python working directory: Always set to `src/zipvoice/`  
- Temporary files: `uploads/` and `output/` (auto-cleanup)

## Development Workflow

### Adding New Features
1. **Frontend**: Modify React components in `src/app/page.tsx` 
2. **API**: Add routes in `src/app/api/` - use FormData for file uploads
3. **Text Processing**: Update `normalize.ts` for text transformations
4. **Never touch**: Python inference code in `src/zipvoice/`

### Audio Processing Flow
1. Text → normalization → batching
2. Each batch → Python TTS via API call  
3. Results → merge API → final audio file
4. Support for sound effect token insertion

### State Management Patterns
- Use React useState for UI state
- localStorage for dictionaries and user preferences
- FormData for all file uploads and multipart requests
- No external state management library

## Docker & Deployment

The application includes Docker configuration:
- Multi-stage build (Node.js frontend + Python runtime)
- Volume mounts for models (`src/zipvoice/exp/`) and voices
- Environment variables: `PYTHONPATH=/app/src/zipvoice`

## Common Pitfalls

- **Python paths**: Always use absolute paths for model directories
- **File cleanup**: Temporary files in uploads/output must be cleaned up
- **Conda environment**: Python execution requires specific conda env
- **Working directory**: Python processes must run from `src/zipvoice/`
- **Unicode handling**: Text normalization is critical for Vietnamese TTS
- **Model checkpoints**: Auto-select latest iteration number from checkpoint names

## Vietnamese Language Specifics

- Default tokenizer: `espeak` 
- Language code: `vi`
- Supports both text normalization and custom pronunciation dictionaries
- Sound effect integration for mixed audio content
