# Version 2.0 Refactoring Changelog

## Overview
Complete refactoring from complex advanced controls to simplified, reliable defaults-only approach with real-time GPU monitoring and emergency safety controls.

## Backend Changes (`backend/main.py`)

### ✅ **Configuration Simplification**
- **Removed**: `VIETNAMESE_DEFAULTS` complex parameter system
- **Added**: `ZIPVOICE_DEFAULTS` using recommended ZipVoice settings
- **Default Profile**: Automatic fallback to "tina" profile when none selected

### ✅ **GPU Monitoring & Safety**
- **Added**: Real-time GPU temperature monitoring
- **Added**: Automatic thermal protection (stop at 90°C, throttle at 85°C)
- **Added**: GPU utilization and VRAM usage tracking
- **Added**: Emergency stop functionality for runaway processes

### ✅ **Performance Metrics**
- **Added**: `RenderMetrics` class with last 1000 renders tracking
- **Added**: Word count vs time analysis for accurate estimation
- **Added**: Performance-based time prediction system

### ✅ **Sentence-Based Processing**
- **Added**: Text splitting into Vietnamese sentences (follows `refer/simple-index.py`)
- **Added**: Individual sentence rendering in `/DOING` folder
- **Added**: Audio segment merging for final output
- **Added**: 60-second timeout per sentence batch

### ✅ **New API Endpoints**
- **Added**: `/gpu_status` - Real-time GPU temperature, utilization, VRAM
- **Added**: `/render_status` - Current processing status and progress
- **Added**: `/stop_render` - Emergency stop for current processes
- **Added**: `/performance_metrics` - Historical performance data
- **Added**: `/synthesize_speech_v2` - New simplified synthesis endpoint

### ✅ **Process Control**
- **Added**: `ProcessController` class for emergency stop mechanism
- **Added**: `run_command_with_monitoring` with GPU checks during processing
- **Updated**: All utility functions to use new sentence-based approach

## Frontend Changes (`frontend/src/App.jsx`)

### ✅ **UI Simplification**
- **Removed**: Quality presets section (too complex, no practical benefits)
- **Removed**: Advanced settings panel (all defaults now)
- **Removed**: Token limit controls (unlimited processing via sentence splitting)
- **Updated**: Character count display with "Unlimited processing" indicator

### ✅ **Real-Time Monitoring**
- **Added**: `GPUMonitor` component with 5-second polling
- **Added**: `RenderStatusMonitor` component with processing progress
- **Added**: GPU temperature color coding (green/yellow/red based on heat)
- **Added**: VRAM usage visualization with progress bar
- **Added**: Emergency stop button (only visible during processing)

### ✅ **Voice Profile Focus**
- **Enhanced**: Clean, professional voice profile management UI
- **Improved**: Default voice prominence and recommendation
- **Streamlined**: Profile selection without complex parameter controls

### ✅ **API Integration**
- **Updated**: Synthesis calls to use new `/synthesize_speech_v2` endpoint
- **Removed**: All advanced parameter passing (uses backend defaults)
- **Added**: Real-time status polling during text processing

## CSS Updates (`frontend/src/App.css`)

### ✅ **New Button Styles**
- **Added**: `.btn-danger` for emergency stop functionality
- **Enhanced**: Red gradient with hover effects for critical actions

## Removed Features (User Feedback: "No Practical Benefits")

### ❌ **Quality Presets**
- Fast/Balanced/High/Premium options removed
- ZipVoice defaults provide better results than custom tuning

### ❌ **Advanced Parameter Controls**
- guidance_scale, num_step, feat_scale, target_rms sliders removed
- speed, gpu_offload, context_length controls removed
- All parameters now use proven ZipVoice defaults

### ❌ **Token Limitations**
- Removed context_length restrictions
- Sentence-by-sentence processing handles any text length

## New Core Features

### ✅ **Reliability & Safety**
- GPU thermal protection prevents hardware damage
- Emergency stop prevents infinite processing loops
- Sentence-based processing prevents memory exhaustion

### ✅ **Performance Intelligence**
- Historical data improves time estimates
- Real-time monitoring prevents system overload
- Optimized for 85% GPU utilization target

### ✅ **Professional UX**
- Clean, focused interface without overwhelming options
- Real-time feedback on system status
- Emphasis on voice profile management over technical parameters

## Technical Architecture

### Processing Flow
```
Text Input → Vietnamese Sentence Splitting → Individual Sentence Rendering → Audio Merging → Final Output
```

### Monitoring Flow
```
GPU Status (5s) → Temperature Check → Utilization Check → VRAM Check → Safety Actions
```

### Safety Systems
```
90°C+ → Emergency Stop
85°C+ → Throttle Processing  
95%+ Utilization → Warning Display
Emergency Button → Immediate Process Termination
```

## Migration Notes

### For Users
- **Simplified**: No need to adjust complex parameters
- **Reliable**: Defaults provide consistent high-quality results
- **Safe**: GPU protection prevents hardware issues
- **Unlimited**: Process any text length without token limits

### For Developers
- **Backend**: Use `/synthesize_speech_v2` endpoint
- **Monitoring**: Poll `/gpu_status` and `/render_status` for real-time updates
- **Safety**: Monitor temperature and provide emergency stop functionality
- **Performance**: Use `/performance_metrics` for intelligent time estimation

## User Experience Improvements

1. **Immediate Feedback**: Real-time GPU and processing status
2. **Predictable Results**: Defaults eliminate guesswork
3. **Safety Confidence**: Thermal protection and emergency stops
4. **Unlimited Processing**: Handle any text length reliably
5. **Professional Focus**: Clean UI emphasizing voice quality over technical complexity

## Deployment Ready

- ✅ Docker containers updated with new API endpoints
- ✅ GPU monitoring compatible with nvidia-docker
- ✅ Emergency controls for production safety
- ✅ Performance tracking for system optimization
- ✅ Simplified configuration for easier deployment
