import shutil
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

from app.config import DEFAULT_THRESHOLD
from app.core.extractor import extract_frames_from_url
from app.core.embedder import embed_frames
from app.core.matcher import compute_similarity_matrix, find_matching_segments

router = APIRouter()

class CompareRequest(BaseModel):
    suspect_url: str
    original_url: str
    threshold: float = DEFAULT_THRESHOLD

class CompareResponse(BaseModel):
    hasMatch: bool
    segments: list[dict]
    overallSimilarity: float
    totalMatchDuration: float
    suspectDuration: float
    originalDuration: float
    percentageMatched: float

@router.post("/compare", response_model=CompareResponse)
def compare_videos(req: CompareRequest):
    tmp_a, tmp_b = None, None
    try:
        # 1. Extract frames
        frames_a, dur_a, tmp_a = extract_frames_from_url(req.suspect_url)
        frames_b, dur_b, tmp_b = extract_frames_from_url(req.original_url)

        if not frames_a or not frames_b:
            raise HTTPException(status_code=400, detail="Could not extract frames from one or both videos.")

        # 2. Embed
        emb_a = embed_frames([f["path"] for f in frames_a])
        emb_b = embed_frames([f["path"] for f in frames_b])

        # 3. Match
        sim_matrix = compute_similarity_matrix(emb_a, emb_b)
        segments = find_matching_segments(
            sim_matrix=sim_matrix,
            timestamps_a=[f["timestamp"] for f in frames_a],
            timestamps_b=[f["timestamp"] for f in frames_b],
            threshold=req.threshold,
        )

        total_match_dur = sum(s["durationSec"] for s in segments)
        overall_sim = sum(s["avgSimilarity"] for s in segments) / len(segments) if segments else 0.0
        pct_matched = round((total_match_dur / dur_a) * 100, 2) if dur_a > 0 else 0.0

        return CompareResponse(
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
        # Cleanup
        if tmp_a:
            shutil.rmtree(tmp_a, ignore_errors=True)
        if tmp_b:
            shutil.rmtree(tmp_b, ignore_errors=True)
