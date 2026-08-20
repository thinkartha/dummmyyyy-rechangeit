"""Query service for searching and aggregating data from Elasticsearch."""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from .client import get_elasticsearch_client
from .mappings import IndexNames

logger = logging.getLogger(__name__)


class QueryService:
    """Service for querying Elasticsearch data."""

    def __init__(self):
        self.client = get_elasticsearch_client()

    def search_logs(
        self,
        tenant_id: str,
        query: str = "*",
        level: Optional[str] = None,
        service: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Search logs with filters."""
        filters = [{"term": {"tenant_id": tenant_id}}]

        if level:
            filters.append({"term": {"level": level.upper()}})
        if service:
            filters.append({"term": {"service": service}})

        es_query = {
            "query": {
                "bool": {
                    "must": [{"query_string": {"query": query}}],
                    "filter": filters,
                }
            },
            "sort": [{"timestamp": {"order": "desc"}}],
            "from": offset,
            "size": limit,
        }

        try:
            return self.client.search(IndexNames.logs_index(), es_query)
        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise

    def search_metrics(
        self,
        tenant_id: str,
        metric_name: Optional[str] = None,
        service: Optional[str] = None,
        limit: int = 100,
    ) -> Dict[str, Any]:
        """Search metrics."""
        filters = [{"term": {"tenant_id": tenant_id}}]

        if metric_name:
            filters.append({"match": {"metric_name": metric_name}})
        if service:
            filters.append({"term": {"service": service}})

        es_query = {
            "query": {"bool": {"filter": filters}},
            "sort": [{"timestamp": {"order": "desc"}}],
            "size": limit,
        }

        try:
            return self.client.search(IndexNames.metrics_index(), es_query)
        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise

    def search_traces(
        self,
        tenant_id: str,
        trace_id: Optional[str] = None,
        service: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> Dict[str, Any]:
        """Search traces/spans."""
        filters = [{"term": {"tenant_id": tenant_id}}]

        if trace_id:
            filters.append({"term": {"trace_id": trace_id}})
        if service:
            filters.append({"term": {"service": service}})
        if status:
            filters.append({"term": {"status": status}})

        es_query = {
            "query": {"bool": {"filter": filters}},
            "sort": [{"timestamp": {"order": "desc"}}],
            "size": limit,
        }

        try:
            return self.client.search(IndexNames.traces_index(), es_query)
        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise

    def get_log_aggregations(
        self,
        tenant_id: str,
        group_by: str = "service",
        hours: int = 24,
    ) -> Dict[str, Any]:
        """Get log aggregations."""
        es_query = {
            "query": {
                "bool": {
                    "filter": [
                        {"term": {"tenant_id": tenant_id}},
                        {
                            "range": {
                                "timestamp": {
                                    "gte": f"now-{hours}h",
                                    "lte": "now",
                                }
                            }
                        },
                    ]
                }
            },
            "aggs": {
                "grouped": {
                    "terms": {
                        "field": group_by,
                        "size": 100,
                    },
                    "aggs": {
                        "by_level": {
                            "terms": {
                                "field": "level",
                                "size": 10,
                            }
                        },
                        "count": {"value_count": {"field": "_id"}},
                    },
                }
            },
            "size": 0,
        }

        try:
            return self.client.search(IndexNames.logs_index(), es_query)
        except Exception as e:
            logger.error(f"Aggregation failed: {e}")
            raise

    def get_metrics_aggregations(
        self,
        tenant_id: str,
        metric_name: str,
        bucket_size: str = "5m",
    ) -> Dict[str, Any]:
        """Get metrics time-series aggregations."""
        es_query = {
            "query": {
                "bool": {
                    "filter": [
                        {"term": {"tenant_id": tenant_id}},
                        {"match": {"metric_name": metric_name}},
                    ]
                }
            },
            "aggs": {
                "over_time": {
                    "date_histogram": {
                        "field": "timestamp",
                        "fixed_interval": bucket_size,
                    },
                    "aggs": {
                        "avg_value": {"avg": {"field": "value"}},
                        "max_value": {"max": {"field": "value"}},
                        "min_value": {"min": {"field": "value"}},
                    },
                }
            },
            "size": 0,
        }

        try:
            return self.client.search(IndexNames.metrics_index(), es_query)
        except Exception as e:
            logger.error(f"Aggregation failed: {e}")
            raise

    def get_trace_stats(
        self,
        tenant_id: str,
        hours: int = 24,
    ) -> Dict[str, Any]:
        """Get trace statistics."""
        es_query = {
            "query": {
                "bool": {
                    "filter": [
                        {"term": {"tenant_id": tenant_id}},
                        {
                            "range": {
                                "timestamp": {
                                    "gte": f"now-{hours}h",
                                    "lte": "now",
                                }
                            }
                        },
                    ]
                }
            },
            "aggs": {
                "by_service": {
                    "terms": {"field": "service", "size": 100},
                    "aggs": {
                        "error_rate": {
                            "terms": {"field": "error", "size": 2}
                        },
                        "avg_duration": {"avg": {"field": "duration_ms"}},
                    },
                }
            },
            "size": 0,
        }

        try:
            return self.client.search(IndexNames.traces_index(), es_query)
        except Exception as e:
            logger.error(f"Stats query failed: {e}")
            raise
