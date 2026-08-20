"""Services for indexing data into Elasticsearch."""

import logging
from typing import Optional, List, Dict, Any
from .client import get_elasticsearch_client
from .pipeline import Pipeline, PipelineBuilder
from .mappings import IndexMappings, IndexNames

logger = logging.getLogger(__name__)


class LogIndexer:
    """Service for indexing logs to Elasticsearch."""

    def __init__(self):
        self.client = get_elasticsearch_client()
        self.pipeline = None

    def initialize(self, tenant_id: str):
        """Initialize indexer with tenant-specific pipeline."""
        self.pipeline = PipelineBuilder.logs_pipeline(tenant_id)
        # Create index if it doesn't exist
        try:
            self.client.create_index(
                IndexNames.logs_index(),
                IndexMappings.logs_mapping(),
                IndexMappings.index_settings()
            )
        except Exception as e:
            logger.warning(f"Index creation: {e}")

    def index_log(self, log_data: Dict[str, Any]) -> Optional[str]:
        """Index a single log entry."""
        if not self.pipeline:
            raise RuntimeError("Indexer not initialized")
        
        processed = self.pipeline.process(log_data)
        if processed is None:
            logger.debug("Log filtered out by pipeline")
            return None

        try:
            doc_id = self.client.index_document(
                IndexNames.logs_index(),
                processed
            )
            logger.debug(f"Indexed log: {doc_id}")
            return doc_id
        except Exception as e:
            logger.error(f"Failed to index log: {e}")
            raise

    def bulk_index_logs(self, logs: List[Dict[str, Any]]) -> tuple[int, list]:
        """Bulk index multiple logs."""
        if not self.pipeline:
            raise RuntimeError("Indexer not initialized")

        processed_logs = []
        for log in logs:
            processed = self.pipeline.process(log)
            if processed:
                processed_logs.append(processed)

        if not processed_logs:
            logger.warning("No logs to index after pipeline processing")
            return 0, []

        try:
            return self.client.bulk_index(IndexNames.logs_index(), processed_logs)
        except Exception as e:
            logger.error(f"Bulk indexing failed: {e}")
            raise


class MetricsIndexer:
    """Service for indexing metrics to Elasticsearch."""

    def __init__(self):
        self.client = get_elasticsearch_client()
        self.pipeline = None

    def initialize(self, tenant_id: str):
        """Initialize indexer with tenant-specific pipeline."""
        self.pipeline = PipelineBuilder.metrics_pipeline(tenant_id)
        try:
            self.client.create_index(
                IndexNames.metrics_index(),
                IndexMappings.metrics_mapping(),
                IndexMappings.index_settings()
            )
        except Exception as e:
            logger.warning(f"Index creation: {e}")

    def index_metric(self, metric_data: Dict[str, Any]) -> Optional[str]:
        """Index a single metric."""
        if not self.pipeline:
            raise RuntimeError("Indexer not initialized")

        processed = self.pipeline.process(metric_data)
        if processed is None:
            logger.debug("Metric filtered out by pipeline")
            return None

        try:
            doc_id = self.client.index_document(
                IndexNames.metrics_index(),
                processed
            )
            logger.debug(f"Indexed metric: {doc_id}")
            return doc_id
        except Exception as e:
            logger.error(f"Failed to index metric: {e}")
            raise

    def bulk_index_metrics(self, metrics: List[Dict[str, Any]]) -> tuple[int, list]:
        """Bulk index multiple metrics."""
        if not self.pipeline:
            raise RuntimeError("Indexer not initialized")

        processed_metrics = []
        for metric in metrics:
            processed = self.pipeline.process(metric)
            if processed:
                processed_metrics.append(processed)

        if not processed_metrics:
            logger.warning("No metrics to index after pipeline processing")
            return 0, []

        try:
            return self.client.bulk_index(IndexNames.metrics_index(), processed_metrics)
        except Exception as e:
            logger.error(f"Bulk indexing failed: {e}")
            raise


class TracesIndexer:
    """Service for indexing traces to Elasticsearch."""

    def __init__(self):
        self.client = get_elasticsearch_client()
        self.pipeline = None

    def initialize(self, tenant_id: str):
        """Initialize indexer with tenant-specific pipeline."""
        self.pipeline = PipelineBuilder.traces_pipeline(tenant_id)
        try:
            self.client.create_index(
                IndexNames.traces_index(),
                IndexMappings.traces_mapping(),
                IndexMappings.index_settings()
            )
        except Exception as e:
            logger.warning(f"Index creation: {e}")

    def index_span(self, span_data: Dict[str, Any]) -> Optional[str]:
        """Index a single span/trace."""
        if not self.pipeline:
            raise RuntimeError("Indexer not initialized")

        processed = self.pipeline.process(span_data)
        if processed is None:
            logger.debug("Span filtered out by pipeline")
            return None

        try:
            doc_id = self.client.index_document(
                IndexNames.traces_index(),
                processed,
                doc_id=processed.get("span_id")
            )
            logger.debug(f"Indexed span: {doc_id}")
            return doc_id
        except Exception as e:
            logger.error(f"Failed to index span: {e}")
            raise

    def bulk_index_spans(self, spans: List[Dict[str, Any]]) -> tuple[int, list]:
        """Bulk index multiple spans."""
        if not self.pipeline:
            raise RuntimeError("Indexer not initialized")

        processed_spans = []
        for span in spans:
            processed = self.pipeline.process(span)
            if processed:
                processed_spans.append(processed)

        if not processed_spans:
            logger.warning("No spans to index after pipeline processing")
            return 0, []

        try:
            return self.client.bulk_index(IndexNames.traces_index(), processed_spans)
        except Exception as e:
            logger.error(f"Bulk indexing failed: {e}")
            raise
