import shutil
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

from app.config import DEFAULT_THRESHOLD
from app.core.audio_extractor import extract_audio_from_url
from app.core.audio_fingerprinter import fingerprint_segments
from app.core.audio_matcher import (
    compute_segment_similarity_matrix,
    find_matching_audio_segments,
)

router = APIRouter()


class AudioCompareRequest(BaseModel):
    suspect_url: str
    original_url: str
    threshold: float = DEFAULT_THRESHOLD


class AudioCompareResponse(BaseModel):
    hasMatch: bool
    segments: list[dict]
    overallSimilarity: float
    totalMatchDuration: float
    suspectDuration: float
    originalDuration: float
    percentageMatched: float


@router.post("/compare/audio", response_model=AudioCompareResponse)
def compare_audio(req: AudioCompareRequest):
    tmp_a, tmp_b = None, None
    try:
        # 1. Extract audio from both videos
        audio_a, dur_a, tmp_a = extract_audio_from_url(req.suspect_url)
        audio_b, dur_b, tmp_b = extract_audio_from_url(req.original_url)

        # 2. Fingerprint into segments
        segs_a = fingerprint_segments(audio_a)
        segs_b = fingerprint_segments(audio_b)

        if not segs_a or not segs_b:
            return AudioCompareResponse(
                hasMatch=False,
                segments=[],
                overallSimilarity=0.0,
                totalMatchDuration=0.0,
                suspectDuration=dur_a,
                originalDuration=dur_b,
                percentageMatched=0.0,
            )

        # 3. Build similarity matrix and find matching segments
        sim_matrix = compute_segment_similarity_matrix(segs_a, segs_b)
        segments = find_matching_audio_segments(
            sim_matrix=sim_matrix,
            segments_a=segs_a,
            segments_b=segs_b,
            threshold=req.threshold,
        )

        total_match_dur = sum(s["durationSec"] for s in segments)
        overall_sim = (
            sum(s["avgSimilarity"] for s in segments) / len(segments)
            if segments else 0.0
        )
        pct_matched = round((total_match_dur / dur_a) * 100, 2) if dur_a > 0 else 0.0

        return AudioCompareResponse(
            hasMatch=len(segments) > 0,
            segments=segments,
            overallSimilarity=round(overall_sim, 4),
            totalMatchDuration=round(total_match_dur, 2),
            suspectDuration=dur_a,
            originalDuration=dur_b,
            percentageMatched=pct_matched,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_a:
            shutil.rmtree(tmp_a, ignore_errors=True)
        if tmp_b:
            shutil.rmtree(tmp_b, ignore_errors=True)
