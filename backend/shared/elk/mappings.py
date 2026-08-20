"""Index mappings and settings for ELK Stack indices."""

from typing import Dict, Any


class IndexMappings:
    """Index mappings for different data types."""

    @staticmethod
    def logs_mapping() -> Dict[str, Any]:
        """Mapping for log indices."""
        return {
            "properties": {
                "timestamp": {"type": "date"},
                "message": {"type": "text"},
                "level": {"type": "keyword"},
                "logger": {"type": "keyword"},
                "service": {"type": "keyword"},
                "environment": {"type": "keyword"},
                "tenant_id": {"type": "keyword"},
                "trace_id": {"type": "keyword"},
                "span_id": {"type": "keyword"},
                "host": {"type": "keyword"},
                "tags": {"type": "nested"},
                "attributes": {"type": "object"},
            }
        }

    @staticmethod
    def metrics_mapping() -> Dict[str, Any]:
        """Mapping for metrics indices."""
        return {
            "properties": {
                "timestamp": {"type": "date"},
                "metric_name": {"type": "keyword"},
                "value": {"type": "double"},
                "unit": {"type": "keyword"},
                "service": {"type": "keyword"},
                "environment": {"type": "keyword"},
                "tenant_id": {"type": "keyword"},
                "resource": {"type": "object"},
                "attributes": {"type": "object"},
                "exemplars": {"type": "nested"},
            }
        }

    @staticmethod
    def traces_mapping() -> Dict[str, Any]:
        """Mapping for traces indices."""
        return {
            "properties": {
                "timestamp": {"type": "date"},
                "trace_id": {"type": "keyword"},
                "span_id": {"type": "keyword"},
                "parent_span_id": {"type": "keyword"},
                "operation_name": {"type": "keyword"},
                "service": {"type": "keyword"},
                "status": {"type": "keyword"},
                "duration_ms": {"type": "double"},
                "start_time": {"type": "date"},
                "end_time": {"type": "date"},
                "environment": {"type": "keyword"},
                "tenant_id": {"type": "keyword"},
                "tags": {"type": "nested"},
                "attributes": {"type": "object"},
                "error": {"type": "boolean"},
                "error_message": {"type": "text"},
            }
        }

    @staticmethod
    def index_settings() -> Dict[str, Any]:
        """Common index settings."""
        return {
            "number_of_shards": 3,
            "number_of_replicas": 1,
            "refresh_interval": "1s",
            "index.lifecycle.name": "default-policy",
        }


class IndexNames:
    """Standard index naming patterns."""

    @staticmethod
    def logs_index(date: str = None) -> str:
        """Logs index name with optional date suffix."""
        suffix = f"-{date}" if date else ""
        return f"logs{suffix}"

    @staticmethod
    def metrics_index(date: str = None) -> str:
        """Metrics index name with optional date suffix."""
        suffix = f"-{date}" if date else ""
        return f"metrics{suffix}"

    @staticmethod
    def traces_index(date: str = None) -> str:
        """Traces index name with optional date suffix."""
        suffix = f"-{date}" if date else ""
        return f"traces{suffix}"
