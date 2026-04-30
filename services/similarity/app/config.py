import os

# Server
HOST = os.getenv("SIMILARITY_HOST", "127.0.0.1")
PORT = int(os.getenv("SIMILARITY_PORT", "8100"))

# CLIP model — ViT-B/32 is the best speed/accuracy trade-off
CLIP_MODEL = os.getenv("CLIP_MODEL", "clip-ViT-B-32")

# Frame extraction
SAMPLE_FPS = int(os.getenv("SAMPLE_FPS", "1"))          # frames per second
MAX_FRAMES = int(os.getenv("MAX_FRAMES", "300"))         # cap for long videos

# Matching
DEFAULT_THRESHOLD = float(os.getenv("MATCH_THRESHOLD", "0.80"))
GAP_TOLERANCE_SEC = int(os.getenv("GAP_TOLERANCE_SEC", "2"))  # merge segments within this gap

# Audio fingerprinting (Chromaprint)
AUDIO_SAMPLE_RATE = int(os.getenv("AUDIO_SAMPLE_RATE", "16000"))     # Hz for audio extraction
AUDIO_SEGMENT_SEC = int(os.getenv("AUDIO_SEGMENT_SEC", "15"))        # seconds per fingerprint segment
