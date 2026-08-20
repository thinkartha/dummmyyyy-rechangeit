"""Elasticsearch client manager with connection pooling and error handling."""

from typing import Optional
from elasticsearch import Elasticsearch, helpers
from elasticsearch.exceptions import ApiError, TransportError
import logging
import os

logger = logging.getLogger(__name__)

# Comma-separated, same name docker-compose.yml uses. Local development falls back to
# localhost; a Lambda with no configured hosts treats Elasticsearch as disabled.
ES_HOSTS_ENV = "ELASTICSEARCH_HOSTS"


class ElasticsearchNotConfigured(RuntimeError):
    """Raised when an optional Elasticsearch operation is used without a cluster."""


class ElasticsearchClient:
    """Manages Elasticsearch connection and operations."""

    def __init__(self, hosts: list[str] = None, **kwargs):
        """
        Initialize Elasticsearch client.

        Args:
            hosts: List of Elasticsearch hosts. Defaults to $ELASTICSEARCH_HOSTS, then
                ['http://localhost:9200'] outside Lambda.
            **kwargs: Additional kwargs for Elasticsearch client
        """
        if hosts is None:
            hosts = [h.strip() for h in os.getenv(ES_HOSTS_ENV, "").split(",") if h.strip()]
        # The SAM stack does not provision Elasticsearch. In Lambda, an unset host means
        # the optional feature is disabled; it must not fall back to the Lambda container.
        if not hosts and os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
            self.client = None
            logger.info("ELASTICSEARCH_HOSTS unset; Elasticsearch features are disabled")
            return
        if not hosts:
            hosts = ["http://localhost:9200"]

        self.client = Elasticsearch(
            hosts=hosts,
            request_timeout=30,
            max_retries=3,
            retry_on_timeout=True,
            **kwargs
        )

    def _require_client(self) -> Elasticsearch:
        if self.client is None:
            raise ElasticsearchNotConfigured(
                "Elasticsearch is not configured for this deployment"
            )
        return self.client

    def health(self) -> dict:
        """Check Elasticsearch cluster health."""
        try:
            return self._require_client().cluster.health()
        except (ApiError, TransportError) as e:
            logger.error(f"Elasticsearch health check failed: {e}")
            raise

    def create_index(
        self, 
        index: str, 
        mappings: dict, 
        settings: Optional[dict] = None
    ) -> bool:
        """Create an index with mappings and settings."""
        try:
            body = {"mappings": mappings}
            if settings:
                body["settings"] = settings
            
            self._require_client().indices.create(index=index, body=body, ignore=400)
            logger.info(f"Index '{index}' created or already exists")
            return True
        except (ApiError, TransportError) as e:
            logger.error(f"Failed to create index '{index}': {e}")
            raise

    def index_document(self, index: str, doc: dict, doc_id: Optional[str] = None) -> str:
        """Index a single document."""
        try:
            result = self._require_client().index(index=index, document=doc, id=doc_id)
            return result["_id"]
        except (ApiError, TransportError) as e:
            logger.error(f"Failed to index document: {e}")
            raise

    def bulk_index(self, index: str, docs: list[dict]) -> tuple[int, list]:
        """Bulk index documents for better performance."""
        try:
            actions = [
                {
                    "_index": index,
                    "_source": doc,
                }
                for doc in docs
            ]
            success, errors = helpers.bulk(self._require_client(), actions, raise_on_error=False)
            logger.info(f"Bulk indexed {success} documents to '{index}'")
            return success, errors
        except (ApiError, TransportError) as e:
            logger.error(f"Bulk indexing failed: {e}")
            raise

    def search(self, index: str, query: dict) -> dict:
        """Execute a search query.

        ignore_unavailable: an index only exists once something has been indexed into it,
        so a tenant that has ingested nothing yet has no `logs` index. That is an empty
        result, not an error — without this every search 500s until the first document
        lands.
        """
        try:
            return self._require_client().search(
                index=index,
                body=query,
                ignore_unavailable=True,
            )
        except (ApiError, TransportError) as e:
            logger.error(f"Search query failed: {e}")
            raise

    def delete_index(self, index: str) -> bool:
        """Delete an index."""
        try:
            self._require_client().indices.delete(index=index, ignore=404)
            logger.info(f"Index '{index}' deleted")
            return True
        except (ApiError, TransportError) as e:
            logger.error(f"Failed to delete index '{index}': {e}")
            raise

    def close(self):
        """Close the Elasticsearch connection."""
        if self.client is not None:
            self.client.close()


# Global client instance
_client: Optional[ElasticsearchClient] = None


def get_elasticsearch_client(hosts: list[str] = None) -> ElasticsearchClient:
    """Get or create the global Elasticsearch client."""
    global _client
    if _client is None:
        _client = ElasticsearchClient(hosts=hosts)
    return _client


def close_elasticsearch_client():
    """Close the global Elasticsearch client."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
