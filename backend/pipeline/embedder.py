"""Embedder → Qdrant (rag-plan §4). Lazy & GUARDED.

Heavy deps (sentence-transformers, qdrant-client, torch) TIDAK di-import di
level modul, supaya skeleton Fase 2 bisa diverifikasi tanpa GPU/Qdrant.
`embed_case` raise `EmbedUnavailable` jika deps/Qdrant tak ada → ingest
lanjut registry-only (`--no-embed`). Embedding nyata dijalankan saat infra
Qdrant siap (Fase 2 lanjut / Fase 3).

Isolasi per-kasus (kontrak §8.5): satu collection `kasus_XX` per kasus,
retrieval tak boleh lintas kasus.
"""
from __future__ import annotations

from app.config import get_settings
from pipeline.parser import ParsedCase


class EmbedUnavailable(RuntimeError):
    pass


def _chunks(pc: ParsedCase) -> list[dict]:
    # Section-based chunking (rag-plan §4.2): 1 section = 1 chunk, jaga tabel utuh.
    return [
        {
            "case_id": pc.case_id,
            "collection": pc.collection_name,
            "section_index": s.index,
            "section_name": s.name,
            "text": s.text,
        }
        for s in pc.bagian_a_sections
        if len(s.text) >= 40
    ]


def embed_case(pc: ParsedCase) -> int:
    """Embed Bagian A ke Qdrant collection `kasus_XX`. Return jumlah chunk."""
    try:
        from qdrant_client import QdrantClient
        from qdrant_client.models import Distance, PointStruct, VectorParams
        from sentence_transformers import SentenceTransformer
    except ImportError as e:  # deps belum diinstal (skeleton Fase 2)
        raise EmbedUnavailable(f"Embedding deps belum tersedia: {e}") from e

    settings = get_settings()
    try:
        client = QdrantClient(url=settings.qdrant_url, timeout=5)
        client.get_collections()  # health check
    except Exception as e:  # Qdrant tidak jalan
        raise EmbedUnavailable(f"Qdrant tidak terjangkau di {settings.qdrant_url}: {e}") from e

    chunks = _chunks(pc)
    if not chunks:
        return 0

    model = SentenceTransformer(settings.embed_model)
    vectors = model.encode(
        [f"passage: {c['text']}" for c in chunks], normalize_embeddings=True
    )
    dim = len(vectors[0])

    col = pc.collection_name
    client.recreate_collection(
        collection_name=col,
        vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
    )
    client.upsert(
        collection_name=col,
        points=[
            PointStruct(id=i, vector=list(map(float, v)), payload=chunks[i])
            for i, v in enumerate(vectors)
        ],
    )
    return len(chunks)
