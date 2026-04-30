"""
Audio segment matching using Chromaprint fingerprints.

Core logic:
1. Compare fingerprints from suspect and original audio using bit-level similarity.
2. For each suspect segment, find the best-matching original segment.
3. Group consecutive high-similarity segments into contiguous matched ranges.
4. Filter by average similarity threshold.

Chromaprint fingerprints are arrays of 32-bit integers — comparison is done
via popcount of XOR (Hamming distance on bit-level representation).
"""

import numpy as np
from app.config import DEFAULT_THRESHOLD


def _hamming_similarity(fp_a: list[int], fp_b: list[int]) -> float:
    """
    Compute normalised bit-level similarity between two Chromaprint fingerprints.

    Uses XOR + popcount: similarity = 1 - (hamming_distance / total_bits).
    Fingerprints may be different lengths; we compare the overlap region.
    """
    min_len = min(len(fp_a), len(fp_b))
    if min_len == 0:
        return 0.0

    # Convert to unsigned 32-bit numpy arrays for fast bitwise ops
    a = np.array(fp_a[:min_len], dtype=np.uint32)
    b = np.array(fp_b[:min_len], dtype=np.uint32)

    xor = a ^ b

    # Count differing bits across all integers
    total_bits = 0
    for val in xor:
        total_bits += bin(int(val)).count("1")

    max_bits = min_len * 32
    return 1.0 - (total_bits / max_bits)


def compute_segment_similarity_matrix(
    segments_a: list[dict],
    segments_b: list[dict],
) -> np.ndarray:
    """
    Build an (N, M) similarity matrix between two sets of audio segments.

    Each segment dict has a "fingerprint" key (list[int]).
    """
    n = len(segments_a)
    m = len(segments_b)
    matrix = np.zeros((n, m), dtype=np.float32)

    for i in range(n):
        for j in range(m):
            matrix[i, j] = _hamming_similarity(
                segments_a[i]["fingerprint"],
                segments_b[j]["fingerprint"],
            )

    return matrix


def _format_timestamp(seconds: float) -> str:
    """Convert seconds to MM:SS format."""
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins}:{secs:02d}"


def find_matching_audio_segments(
    sim_matrix: np.ndarray,
    segments_a: list[dict],
    segments_b: list[dict],
    threshold: float = DEFAULT_THRESHOLD,
) -> list[dict]:
    """
    Find contiguous audio segments where suspect matches original.

    Algorithm (mirrors the video matcher):
    1. For each suspect segment, find the best-matching original segment.
    2. Keep only pairs above the similarity threshold.
    3. Group consecutive matched segments into contiguous ranges.
    4. Filter by average similarity.

    Returns list of segment match dicts.
    """
    n = sim_matrix.shape[0]

    # Step 1 & 2: best match per suspect segment
    matched_pairs = []
    for i in range(n):
        best_j = int(np.argmax(sim_matrix[i]))
        score = float(sim_matrix[i, best_j])
        if score >= threshold:
            matched_pairs.append({
                "idx_a": i,
                "idx_b": best_j,
                "start_a": segments_a[i]["startSec"],
                "end_a": segments_a[i]["endSec"],
                "start_b": segments_b[best_j]["startSec"],
                "end_b": segments_b[best_j]["endSec"],
                "similarity": score,
            })

    if not matched_pairs:
        return []

    # Step 3: Group consecutive matches (adjacent segment indices)
    segments_raw = []
    current = [matched_pairs[0]]

    for pair in matched_pairs[1:]:
        prev = current[-1]
        if pair["idx_a"] - prev["idx_a"] <= 2:  # allow 1-segment gap
            current.append(pair)
        else:
            segments_raw.append(current)
            current = [pair]
    segments_raw.append(current)

    # Step 4: Build output, filter by avg similarity
    results = []
    for seg_pairs in segments_raw:
        scores = [p["similarity"] for p in seg_pairs]
        avg_sim = sum(scores) / len(scores)

        if avg_sim < threshold:
            continue

        results.append({
            "suspectRange": {
                "start": _format_timestamp(seg_pairs[0]["start_a"]),
                "end": _format_timestamp(seg_pairs[-1]["end_a"]),
                "startSec": seg_pairs[0]["start_a"],
                "endSec": seg_pairs[-1]["end_a"],
            },
            "originalRange": {
                "start": _format_timestamp(min(p["start_b"] for p in seg_pairs)),
                "end": _format_timestamp(max(p["end_b"] for p in seg_pairs)),
                "startSec": min(p["start_b"] for p in seg_pairs),
                "endSec": max(p["end_b"] for p in seg_pairs),
            },
            "avgSimilarity": round(avg_sim, 4),
            "peakSimilarity": round(max(scores), 4),
            "segmentCount": len(seg_pairs),
            "durationSec": round(seg_pairs[-1]["end_a"] - seg_pairs[0]["start_a"], 2),
        })

    return results
