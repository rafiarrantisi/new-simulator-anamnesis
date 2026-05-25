"""Audit log writer (best-effort; gagal log != gagal action)."""
from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

from app.domains.admin.models import AdminAuditLog

_log = logging.getLogger("ophtha.audit")


def audit(
    db: Session,
    *,
    user_id: str | None,
    action: str,
    target_type: str = "",
    target_id: str = "",
    diff: dict[str, Any] | None = None,
) -> None:
    """Best-effort write — kalau gagal (DB issue), log warning & swallow.

    Caller bertanggung jawab call db.commit() di transaksi yg sama supaya
    audit row & mutation row commit atomik. Kalau audit-only (gak dlm
    transaksi action), audit() auto-commit.
    """
    try:
        row = AdminAuditLog(
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            diff_summary=diff or None,
        )
        db.add(row)
        # Tak auto-commit — biar caller decide transaction boundary.
    except Exception as e:  # pragma: no cover — defensive
        _log.warning("[audit] gagal tulis log %s/%s: %s", action, target_id, e)
