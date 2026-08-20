"""Data ingestion pipeline for processing and transforming data before indexing."""

import json
import logging
from typing import Any, Callable, Dict, List
from datetime import datetime

logger = logging.getLogger(__name__)


class Pipeline:
    """Configurable data processing pipeline."""

    def __init__(self, name: str):
        """Initialize pipeline with a name."""
        self.name = name
        self.filters: List[Callable[[Dict[str, Any]], Dict[str, Any]]] = []

    def add_filter(self, filter_fn: Callable[[Dict[str, Any]], Dict[str, Any]]) -> "Pipeline":
        """Add a filter to the pipeline."""
        self.filters.append(filter_fn)
        return self

    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process data through all filters."""
        result = data.copy()
        for filter_fn in self.filters:
            try:
                result = filter_fn(result)
                if result is None:
                    return None
            except Exception as e:
                logger.error(f"Filter error in {self.name}: {e}", exc_info=True)
                return None
        return result


class Filters:
    """Pre-built filter functions for common operations."""

    @staticmethod
    def add_timestamp() -> Callable:
        """Add timestamp if not present."""
        def filter_fn(data: Dict[str, Any]) -> Dict[str, Any]:
            if "timestamp" not in data or data["timestamp"] is None:
                data["timestamp"] = datetime.utcnow().isoformat() + "Z"
            return data
        return filter_fn

    @staticmethod
    def parse_json_message() -> Callable:
        """Try to parse message as JSON if it's a string."""
        def filter_fn(data: Dict[str, Any]) -> Dict[str, Any]:
            if "message" in data and isinstance(data["message"], str):
                try:
                    parsed = json.loads(data["message"])
                    if isinstance(parsed, dict):
                        data["message"] = parsed
                except (json.JSONDecodeError, ValueError):
                    pass
            return data
        return filter_fn

    @staticmethod
    def normalize_level() -> Callable:
        """Normalize log level to uppercase."""
        def filter_fn(data: Dict[str, Any]) -> Dict[str, Any]:
            if "level" in data:
                data["level"] = str(data["level"]).upper()
            return data
        return filter_fn

    @staticmethod
    def extract_trace_context() -> Callable:
        """Extract trace_id and span_id from message or attributes."""
        def filter_fn(data: Dict[str, Any]) -> Dict[str, Any]:
            # Check attributes first
            attrs = data.get("attributes", {})
            if isinstance(attrs, dict):
                if "trace_id" in attrs and "trace_id" not in data:
                    data["trace_id"] = attrs["trace_id"]
                if "span_id" in attrs and "span_id" not in data:
                    data["span_id"] = attrs["span_id"]
            return data
        return filter_fn

    @staticmethod
    def remove_sensitive_fields(fields: List[str]) -> Callable:
        """Remove sensitive fields from data."""
        def filter_fn(data: Dict[str, Any]) -> Dict[str, Any]:
            for field in fields:
                if field in data:
                    del data[field]
            return data
        return filter_fn

    @staticmethod
    def add_tenant_context(tenant_id: str) -> Callable:
        """Add tenant_id to data if not present."""
        def filter_fn(data: Dict[str, Any]) -> Dict[str, Any]:
            if "tenant_id" not in data:
                data["tenant_id"] = tenant_id
            return data
        return filter_fn

    @staticmethod
    def filter_by_level(min_level: str = "INFO") -> Callable:
        """Filter logs by minimum level (DEBUG < INFO < WARN < ERROR < FATAL)."""
        levels = {"DEBUG": 0, "INFO": 1, "WARN": 2, "ERROR": 3, "FATAL": 4}
        min_val = levels.get(min_level.upper(), 0)
        
        def filter_fn(data: Dict[str, Any]) -> Dict[str, Any]:
            level = str(data.get("level", "INFO")).upper()
            if levels.get(level, 0) >= min_val:
                return data
            return None
        return filter_fn

    @staticmethod
    def extract_service_from_logger() -> Callable:
        """Extract service name from logger (format: service.module.class)."""
        def filter_fn(data: Dict[str, Any]) -> Dict[str, Any]:
            if "logger" in data and "service" not in data:
                logger_name = str(data["logger"])
                parts = logger_name.split(".")
                if parts:
                    data["service"] = parts[0]
            return data
        return filter_fn


class PipelineBuilder:
    """Builder for creating standard pipelines."""

    @staticmethod
    def logs_pipeline(tenant_id: str) -> Pipeline:
        """Build standard logs processing pipeline."""
        pipeline = Pipeline("logs")
        pipeline.add_filter(Filters.add_timestamp())
        pipeline.add_filter(Filters.parse_json_message())
        pipeline.add_filter(Filters.normalize_level())
        pipeline.add_filter(Filters.extract_trace_context())
        pipeline.add_filter(Filters.extract_service_from_logger())
        pipeline.add_filter(Filters.add_tenant_context(tenant_id))
        return pipeline

    @staticmethod
    def metrics_pipeline(tenant_id: str) -> Pipeline:
        """Build standard metrics processing pipeline."""
        pipeline = Pipeline("metrics")
        pipeline.add_filter(Filters.add_timestamp())
        pipeline.add_filter(Filters.add_tenant_context(tenant_id))
        return pipeline

    @staticmethod
    def traces_pipeline(tenant_id: str) -> Pipeline:
        """Build standard traces processing pipeline."""
        pipeline = Pipeline("traces")
        pipeline.add_filter(Filters.add_timestamp())
        pipeline.add_filter(Filters.extract_trace_context())
        pipeline.add_filter(Filters.add_tenant_context(tenant_id))
        return pipeline
