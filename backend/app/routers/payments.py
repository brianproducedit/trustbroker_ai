from fastapi import APIRouter

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/status", summary="Payment service status")
def payment_status():
    return {"service": "paypal", "status": "ready"}
