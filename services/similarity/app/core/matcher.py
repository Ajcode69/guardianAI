"""
Similarity matrix computation and temporal segment matching.

Core logic:
1. Compute cosine similarity matrix between two sets of frame embeddings.
2. For each suspect frame, find its best match in the original.
3. Group consecutive high-similarity frames into contiguous segments.
4. Filter segments by average similarity threshold (default 0.80).
"""

import numpy as np
from app.config import DEFAULT_THRESHOLD, GAP_TOLERANCE_SEC, SAMPLE_FPS


def compute_similarity_matrix(embeddings_a: np.ndarray, embeddings_b: np.ndarray) -> np.ndarray:
    """
    Compute cosine similarity matrix between two sets of L2-normalized embeddings.
    Returns shape (N, M) where N = len(embeddings_a), M = len(embeddings_b).
    """
    # Since embeddings are L2-normalized, dot product = cosine similarity
    return embeddings_a @ embeddings_b.T


def _format_timestamp(seconds: float) -> str:
    """Convert seconds to MM:SS format."""
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins}:{secs:02d}"


def find_matching_segments(
    sim_matrix: np.ndarray,
    timestamps_a: list[float],
    timestamps_b: list[float],
    threshold: float = DEFAULT_THRESHOLD,
    gap_tolerance: int = GAP_TOLERANCE_SEC,
) -> list[dict]:
    """
    Find contiguous temporal segments where suspect frames match original frames.

    Algorithm:
    1. For each frame in A (suspect), find the best matching frame in B (original).
    2. Keep only pairs where similarity >= threshold.
    3. Group consecutive matched A-frames into segments, allowing small gaps.
    4. Filter segments where average similarity >= threshold.

    Returns list of segment dicts with timestamps and similarity scores.
    """
    n_frames_a = sim_matrix.shape[0]

    # Step 1 & 2: Find best match per suspect frame, filter by threshold
    matched_pairs = []
    for i in range(n_frames_a):
        best_j = int(np.argmax(sim_matrix[i]))
        score = float(sim_matrix[i, best_j])
        if score >= threshold:
            matched_pairs.append({
                "idx_a": i,
                "idx_b": best_j,
                "time_a": timestamps_a[i],
                "time_b": timestamps_b[best_j],
                "similarity": score,
            })

    if not matched_pairs:
        return []

    # Step 3: Group into contiguous segments
    # Two consecutive matches are "contiguous" if the gap in A-timestamps
    # is within gap_tolerance seconds
    gap_frames = gap_tolerance * SAMPLE_FPS
    segments_raw = []
    current_segment = [matched_pairs[0]]

    for pair in matched_pairs[1:]:
        prev = current_segment[-1]
        # Check if this frame is close enough to the previous matched frame
        if (pair["idx_a"] - prev["idx_a"]) <= (gap_frames + 1):
            current_segment.append(pair)
        else:
            segments_raw.append(current_segment)
            current_segment = [pair]
    segments_raw.append(current_segment)

    # Step 4: Build segment objects, filter by avg similarity
    segments = []
    for seg_pairs in segments_raw:
        scores = [p["similarity"] for p in seg_pairs]
        avg_sim = sum(scores) / len(scores)

        if avg_sim < threshold:
            continue

        segments.append({
            "suspectRange": {
                "start": _format_timestamp(seg_pairs[0]["time_a"]),
                "end": _format_timestamp(seg_pairs[-1]["time_a"]),
                "startSec": seg_pairs[0]["time_a"],
                "endSec": seg_pairs[-1]["time_a"],
            },
            "originalRange": {
                "start": _format_timestamp(min(p["time_b"] for p in seg_pairs)),
                "end": _format_timestamp(max(p["time_b"] for p in seg_pairs)),
                "startSec": min(p["time_b"] for p in seg_pairs),
                "endSec": max(p["time_b"] for p in seg_pairs),
            },
            "avgSimilarity": round(avg_sim, 4),
            "peakSimilarity": round(max(scores), 4),
            "frameCount": len(seg_pairs),
            "durationSec": round(seg_pairs[-1]["time_a"] - seg_pairs[0]["time_a"], 2),
        })

    return segments
