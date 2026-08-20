"""OpenTelemetry OTLP data models and converters."""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class OTLPLog(BaseModel):
    """OpenTelemetry Protocol Log model."""
    timestamp: Optional[datetime] = None
    severity_number: int = 0
    severity_text: Optional[str] = None
    body: str
    attributes: Optional[Dict[str, Any]] = None
    trace_id: Optional[str] = None
    span_id: Optional[str] = None
    flags: int = 0


class OTLPMetric(BaseModel):
    """OpenTelemetry Protocol Metric model."""
    name: str
    timestamp: Optional[datetime] = None
    value: float
    unit: str = ""
    attributes: Optional[Dict[str, Any]] = None


class OTLPSpan(BaseModel):
    """OpenTelemetry Protocol Span model."""
    trace_id: str
    span_id: str
    parent_span_id: Optional[str] = None
    name: str
    kind: str = "INTERNAL"
    start_time: datetime
    end_time: datetime
    status_code: str = "UNSET"
    status_message: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None
    events: Optional[List[Dict[str, Any]]] = None
    links: Optional[List[Dict[str, Any]]] = None


class OTLPConverter:
    """Convert OTLP data to internal formats."""

    @staticmethod
    def log_to_dict(log: OTLPLog, service: str, environment: str = "production") -> Dict[str, Any]:
        """Convert OTLP log to indexable dictionary."""
        return {
            "timestamp": log.timestamp or datetime.utcnow(),
            "message": log.body,
            "level": log.severity_text or "INFO",
            "service": service,
            "environment": environment,
            "trace_id": log.trace_id,
            "span_id": log.span_id,
            "attributes": log.attributes or {},
        }

    @staticmethod
    def metric_to_dict(metric: OTLPMetric, service: str, environment: str = "production") -> Dict[str, Any]:
        """Convert OTLP metric to indexable dictionary."""
        return {
            "timestamp": metric.timestamp or datetime.utcnow(),
            "metric_name": metric.name,
            "value": metric.value,
            "unit": metric.unit,
            "service": service,
            "environment": environment,
            "attributes": metric.attributes or {},
        }

    @staticmethod
    def span_to_dict(span: OTLPSpan, service: str, environment: str = "production") -> Dict[str, Any]:
        """Convert OTLP span to indexable dictionary."""
        duration_ms = (span.end_time - span.start_time).total_seconds() * 1000
        error = span.status_code != "OK"
        
        return {
            "timestamp": span.start_time,
            "trace_id": span.trace_id,
            "span_id": span.span_id,
            "parent_span_id": span.parent_span_id,
            "operation_name": span.name,
            "service": service,
            "environment": environment,
            "status": span.status_code,
            "duration_ms": duration_ms,
            "start_time": span.start_time,
            "end_time": span.end_time,
            "error": error,
            "error_message": span.status_message,
            "attributes": span.attributes or {},
            "events": span.events or [],
        }


class TraceContext(BaseModel):
    """W3C Trace Context."""
    trace_id: str = None
    span_id: str = None
    sampled: bool = False

    def __init__(self, trace_id: str = None, span_id: str = None, **kwargs):
        super().__init__(**kwargs)
        self.trace_id = trace_id or self._generate_id()
        self.span_id = span_id or self._generate_id()

    @staticmethod
    def _generate_id() -> str:
        """Generate random trace/span ID."""
        return uuid.uuid4().hex


def extract_trace_context(headers: Dict[str, str]) -> Optional[TraceContext]:
    """Extract trace context from request headers (W3C Trace Context)."""
    traceparent = headers.get("traceparent", "")
    if not traceparent:
        return None
    
    try:
        # Format: version-trace_id-parent_id-trace_flags
        parts = traceparent.split("-")
        if len(parts) >= 3:
            return TraceContext(
                trace_id=parts[1],
                span_id=parts[2],
                sampled=(int(parts[3]) & 1) == 1 if len(parts) > 3 else False
            )
    except Exception:
        pass
    
    return None
