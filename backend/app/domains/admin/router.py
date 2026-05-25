"""Admin meta router (audit log viewer, future user mgmt)."""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.domains.admin.models import AdminAuditLog
from app.domains.auth.models import User
from app.shared.dependencies import require_admin
from app.shared.envelope import ok

router = APIRouter(prefix="/api/admin", tags=["admin-meta"])


@router.get("/audit")
def list_audit(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    limit = min(max(limit, 1), 500)
    rows = db.scalars(
        select(AdminAuditLog).order_by(AdminAuditLog.ts.desc()).offset(offset).limit(limit)
    ).all()
    total = db.scalar(select(func.count(AdminAuditLog.id))) or 0
    data = [{
        "id": r.id,
        "userId": r.user_id,
        "action": r.action,
        "targetType": r.target_type or None,
        "targetId": r.target_id or None,
        "diff": r.diff_summary or None,
        "ts": r.ts.isoformat(),
    } for r in rows]
    return ok(data, meta={"total": int(total), "page": offset // limit if limit else 0, "limit": limit})


@router.get("/whoami")
def whoami(admin: User = Depends(require_admin)):
    """Cek cepat: token & role admin valid → 200 + email/role; 403 selain itu."""
    return ok({"email": admin.email, "role": admin.role, "userId": admin.id})
