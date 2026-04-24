"""
CLIP-based frame embedding using sentence-transformers.
Loads the model once (singleton) and encodes frames in batches.
"""

import numpy as np
from PIL import Image
from sentence_transformers import SentenceTransformer

from app.config import CLIP_MODEL

# ── Singleton model instance ──────────────────────────────────────────────────
_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    """Lazy-load the CLIP model on first use."""
    global _model
    if _model is None:
        print(f"[Embedder] Loading CLIP model: {CLIP_MODEL}")
        _model = SentenceTransformer(CLIP_MODEL)
        print(f"[Embedder] Model loaded successfully")
    return _model


def embed_frames(frame_paths: list[str], batch_size: int = 32) -> np.ndarray:
    """
    Embed a list of frame image paths into CLIP vectors.

    Args:
        frame_paths: List of absolute paths to PNG frame files.
        batch_size:  Batch size for encoding (higher = faster on GPU).

    Returns:
        np.ndarray of shape (N, embedding_dim) — L2-normalized embeddings.
    """
    model = _get_model()

    # Load images
    images = [Image.open(p).convert("RGB") for p in frame_paths]

    # Encode in batches — sentence-transformers handles normalization
    embeddings = model.encode(
        images,
        batch_size=batch_size,
        show_progress_bar=False,
        normalize_embeddings=True,  # L2-norm so dot product = cosine sim
    )

    return np.array(embeddings, dtype=np.float32)
