"""
Audio extraction from video files using FFmpeg.
Downloads the video (if not already local) and strips the audio track to WAV.
"""

import os
import subprocess
import tempfile

from app.config import AUDIO_SAMPLE_RATE


def extract_audio(video_path: str, output_dir: str) -> str:
    """
    Extract audio from a video file as a WAV using FFmpeg.

    Args:
        video_path: Path to the input video file.
        output_dir: Directory to write the output WAV file.

    Returns:
        Path to the extracted WAV file.
    """
    os.makedirs(output_dir, exist_ok=True)
    audio_path = os.path.join(output_dir, "audio.wav")

    cmd = [
        "ffmpeg", "-i", video_path,
        "-vn",                          # no video
        "-acodec", "pcm_s16le",         # raw PCM 16-bit little-endian
        "-ar", str(AUDIO_SAMPLE_RATE),  # resample to target rate
        "-ac", "1",                     # mono
        audio_path,
        "-y", "-loglevel", "error"
    ]
    subprocess.run(cmd, check=True, timeout=120)

    if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
        raise RuntimeError(f"FFmpeg produced an empty or missing audio file: {audio_path}")

    return audio_path


def get_audio_duration(audio_path: str) -> float:
    """Get audio duration in seconds using ffprobe."""
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        audio_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    return float(result.stdout.strip())


def extract_audio_from_url(url: str) -> tuple[str, float, str]:
    """
    Download video and extract audio track.

    Returns (audio_path, duration_seconds, temp_dir_path).
    Caller is responsible for cleaning up temp_dir.
    """
    from app.core.extractor import download_video

    tmp_dir = tempfile.mkdtemp(prefix="similarity_audio_")
    video_path = download_video(url, tmp_dir)

    audio_dir = os.path.join(tmp_dir, "audio")
    audio_path = extract_audio(video_path, audio_dir)
    duration = get_audio_duration(audio_path)

    return audio_path, duration, tmp_dir
