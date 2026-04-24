"""
Frame extraction from video files using FFmpeg.
Downloads the video from a URL, extracts frames at a fixed rate.
"""

import os
import tempfile
import subprocess
import requests
from pathlib import Path
from PIL import Image

from app.config import SAMPLE_FPS, MAX_FRAMES


def download_video(url: str, dest_dir: str) -> str:
    """Download a video from a URL to a temp file."""
    resp = requests.get(url, stream=True, timeout=60)
    resp.raise_for_status()

    # Guess extension from content-type
    ct = resp.headers.get("content-type", "")
    ext = ".mp4"
    if "webm" in ct:
        ext = ".webm"
    elif "avi" in ct:
        ext = ".avi"

    path = os.path.join(dest_dir, f"video{ext}")
    with open(path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
    return path


def get_video_duration(video_path: str) -> float:
    """Get video duration in seconds using ffprobe."""
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    return float(result.stdout.strip())


def extract_frames(video_path: str, output_dir: str) -> list[dict]:
    """
    Extract frames from a video at SAMPLE_FPS rate.

    Returns a list of dicts: [{ "path": "/tmp/.../frame_0001.png", "timestamp": 0.0 }, ...]
    """
    os.makedirs(output_dir, exist_ok=True)

    duration = get_video_duration(video_path)
    total_expected = min(int(duration * SAMPLE_FPS), MAX_FRAMES)

    # Use ffmpeg to extract frames at the configured FPS
    output_pattern = os.path.join(output_dir, "frame_%05d.png")
    cmd = [
        "ffmpeg", "-i", video_path,
        "-vf", f"fps={SAMPLE_FPS}",
        "-frames:v", str(MAX_FRAMES),
        "-q:v", "2",
        output_pattern,
        "-y", "-loglevel", "error"
    ]
    subprocess.run(cmd, check=True, timeout=120)

    # Collect extracted frame paths with timestamps
    frames = []
    for filename in sorted(os.listdir(output_dir)):
        if not filename.startswith("frame_"):
            continue
        # frame_00001.png → index 0 → timestamp 0.0s
        idx = int(filename.split("_")[1].split(".")[0]) - 1
        timestamp = idx / SAMPLE_FPS
        frames.append({
            "path": os.path.join(output_dir, filename),
            "timestamp": round(timestamp, 2),
        })

    return frames[:MAX_FRAMES]


def extract_frames_from_url(url: str) -> tuple[list[dict], float, str]:
    """
    Download video and extract frames.
    Returns (frames, duration, temp_dir_path).
    Caller is responsible for cleaning up temp_dir.
    """
    tmp_dir = tempfile.mkdtemp(prefix="similarity_")
    video_path = download_video(url, tmp_dir)
    duration = get_video_duration(video_path)

    frames_dir = os.path.join(tmp_dir, "frames")
    frames = extract_frames(video_path, frames_dir)

    return frames, duration, tmp_dir
