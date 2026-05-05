from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime


@dataclass
class InventoryContext:
    # =============================
    # IDENTIFIERS
    # =============================
    product_id: int

    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None

    # =============================
    # INPUT DATA
    # =============================
    sales_data: Optional[Any] = None
    current_stock: float = 0.0
    periods: int = 30

    # =============================
    # PIPELINE OUTPUTS
    # =============================
    forecast: Dict[str, Any] = field(default_factory=dict)
    decision: Dict[str, Any] = field(default_factory=dict)
    risk: Dict[str, Any] = field(default_factory=dict)

    explanation: Optional[str] = None

    alerts: List[Dict[str, Any]] = field(default_factory=list)

    insight_result: Dict[str, Any] = field(default_factory=dict)
    prediction_result: Dict[str, Any] = field(default_factory=dict)
    alerts_result: List[Dict[str, Any]] = field(default_factory=list)

    # =============================
    # SYSTEM STATE
    # =============================
    errors: List[Dict[str, str]] = field(default_factory=list)
    logs: List[str] = field(default_factory=list)

    # =============================
    # METADATA
    # =============================
    metadata: Dict[str, Any] = field(default_factory=dict)

    # =============================
    # INIT
    # =============================
    def __post_init__(self):
        self.metadata.update({
            "pipeline_version": "v1.0",
            "created_at": datetime.utcnow().isoformat(),
            "model": "prophet_v1"
        })

    # =============================
    # HELPERS
    # =============================
    def add_log(self, message: str):
        self.logs.append(f"{datetime.utcnow().isoformat()} - {message}")

    def add_error(self, step: str, error: Exception):
        self.errors.append({
            "step": step,
            "error": str(error),
            "time": datetime.utcnow().isoformat()
        })