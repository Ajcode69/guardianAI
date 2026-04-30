"""
Chromaprint-based audio fingerprinting.

Uses the `fpcalc` command-line tool (from Chromaprint) to generate
compact fingerprints, then compares them using cross-correlation.

Chromaprint is optimised for exact-match detection of re-encoded audio —
perfect for piracy detection where the audio track is copied verbatim
or transcoded.
"""

import subprocess
import json
import numpy as np

from app.config import AUDIO_SEGMENT_SEC, AUDIO_SAMPLE_RATE


def _run_fpcalc(audio_path: str, chunk_duration: int = 0) -> dict:
    """
    Run fpcalc on an audio file and return the parsed JSON result.

    Args:
        audio_path: Path to WAV/audio file.
        chunk_duration: If > 0, sets the analysis window (-length).
                        If 0, analyses the full file.

    Returns:
        Dict with keys: duration, fingerprint (raw int array).
    """
    cmd = ["fpcalc", "-json", "-raw", audio_path]
    if chunk_duration > 0:
        cmd.extend(["-length", str(chunk_duration)])

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        raise RuntimeError(f"fpcalc failed: {result.stderr.strip()}")

    return json.loads(result.stdout)


def fingerprint_full(audio_path: str) -> dict:
    """
    Generate a full-file Chromaprint fingerprint.

    Returns:
        { "duration": float, "fingerprint": list[int] }
    """
    data = _run_fpcalc(audio_path)
    return {
        "duration": data["duration"],
        "fingerprint": data["fingerprint"],
    }


def fingerprint_segments(audio_path: str, segment_sec: int = AUDIO_SEGMENT_SEC) -> list[dict]:
    """
    Split audio into fixed-length segments and fingerprint each.

    Uses ffmpeg to slice + fpcalc to fingerprint, yielding one
    fingerprint per segment for temporal matching.

    Returns:
        [{ "startSec": 0, "endSec": 15, "fingerprint": [...] }, ...]
    """
    from app.core.audio_extractor import get_audio_duration
    import os, tempfile

    duration = get_audio_duration(audio_path)
    segments = []
    tmp_dir = tempfile.mkdtemp(prefix="audio_seg_")

    try:
        offset = 0.0
        idx = 0
        while offset < duration:
            end = min(offset + segment_sec, duration)
            seg_path = os.path.join(tmp_dir, f"seg_{idx:04d}.wav")

            # Slice with ffmpeg
            cmd = [
                "ffmpeg", "-i", audio_path,
                "-ss", str(offset),
                "-t", str(segment_sec),
                "-acodec", "pcm_s16le",
                "-ar", str(AUDIO_SAMPLE_RATE),
                "-ac", "1",
                seg_path,
                "-y", "-loglevel", "error",
            ]
            subprocess.run(cmd, check=True, timeout=30)

            # Skip segments that are too short for reliable fingerprinting
            if os.path.exists(seg_path) and os.path.getsize(seg_path) > 1000:
                try:
                    fp_data = _run_fpcalc(seg_path, chunk_duration=segment_sec)
                    segments.append({
                        "startSec": round(offset, 2),
                        "endSec": round(end, 2),
                        "fingerprint": fp_data["fingerprint"],
                    })
                except RuntimeError:
                    pass  # skip segments fpcalc can't process

            offset += segment_sec
            idx += 1
    finally:
        import shutil
        shutil.rmtree(tmp_dir, ignore_errors=True)

    return segments
