"""ELK Stack backend module."""

from .client import ElasticsearchClient, get_elasticsearch_client, close_elasticsearch_client
from .mappings import IndexMappings, IndexNames
from .pipeline import Pipeline, Filters, PipelineBuilder
from .otel import OTLPLog, OTLPMetric, OTLPSpan, OTLPConverter, TraceContext
from .indexer import LogIndexer, MetricsIndexer, TracesIndexer
from .queries import QueryService

__all__ = [
    "ElasticsearchClient",
    "get_elasticsearch_client",
    "close_elasticsearch_client",
    "IndexMappings",
    "IndexNames",
    "Pipeline",
    "Filters",
    "PipelineBuilder",
    "OTLPLog",
    "OTLPMetric",
    "OTLPSpan",
    "OTLPConverter",
    "TraceContext",
    "LogIndexer",
    "MetricsIndexer",
    "TracesIndexer",
    "QueryService",
]
