"""OTLP/protobuf ingest.

Protobuf is the default encoding for every OTel SDK exporter and for the collector's
otlphttp exporter, so this is the path most people arrive on. The thing that would break
quietly is the id encoding: OTLP/JSON spells trace and span ids as hex, protobuf carries
raw bytes, and protobuf->dict renders those as base64. Left alone the same span reported
over the two encodings would land under two different ids and never join.
"""

from __future__ import annotations

import pytest

from shared.elk import otlp

pytest.importorskip("opentelemetry.proto.collector.trace.v1.trace_service_pb2")

from opentelemetry.proto.collector.trace.v1 import trace_service_pb2  # noqa: E402
from opentelemetry.proto.common.v1 import common_pb2  # noqa: E402
from opentelemetry.proto.trace.v1 import trace_pb2  # noqa: E402

_TRACE_ID = bytes.fromhex("4bf92f3577b34da6a3ce929d0e0e4736")
_SPAN_ID = bytes.fromhex("00f067aa0ba902b7")


def _export_request() -> bytes:
    span = trace_pb2.Span(
        trace_id=_TRACE_ID,
        span_id=_SPAN_ID,
        name="GET /api/v1/orders",
        kind=trace_pb2.Span.SPAN_KIND_SERVER,
        start_time_unix_nano=1_757_000_000_000_000_000,
        end_time_unix_nano=1_757_000_000_120_000_000,
        status=trace_pb2.Status(code=trace_pb2.Status.STATUS_CODE_ERROR),
    )
    resource_spans = trace_pb2.ResourceSpans(
        resource={"attributes": [common_pb2.KeyValue(
            key="service.name", value=common_pb2.AnyValue(string_value="checkout-api"))]},
        scope_spans=[trace_pb2.ScopeSpans(spans=[span])],
    )
    return trace_service_pb2.ExportTraceServiceRequest(
        resource_spans=[resource_spans]).SerializeToString()


def test_protobuf_ids_come_out_hex_not_base64():
    payload = otlp.decode_protobuf(_export_request(), "traces")
    span = payload["resourceSpans"][0]["scopeSpans"][0]["spans"][0]
    assert span["traceId"] == _TRACE_ID.hex()
    assert span["spanId"] == _SPAN_ID.hex()


def test_protobuf_decodes_to_what_the_json_converter_already_reads():
    """The whole point of decoding to a dict: traces() needs no protobuf awareness."""
    docs = otlp.traces(otlp.decode_protobuf(_export_request(), "traces"))
    assert len(docs) == 1
    doc = docs[0]
    assert doc["trace_id"] == _TRACE_ID.hex()
    assert doc["service"] == "checkout-api"
    # Enums must survive as the numbers the converter switches on. Protobuf's default
    # dict conversion hands back enum *names*, and every span would read as UNSET.
    assert doc["status"] == "ERROR"
    assert doc["error"] is True
    assert doc["attributes"]["span.kind"] == "SERVER"
    # MessageToDict renders 64-bit nanos as strings; the duration must still be a number.
    assert doc["duration_ms"] == pytest.approx(120.0)


def test_a_body_that_is_not_this_signal_is_rejected():
    with pytest.raises(Exception):
        otlp.decode_protobuf(b"\xff\xff\xff\xff not protobuf", "logs")


def test_hexify_leaves_an_already_hex_id_alone():
    """Hex digits are valid base64, so a naive decode turns a correct id into 24 bytes of
    noise. The width check is what stops that, and this is the case that proves it."""
    node = {"traceId": _TRACE_ID.hex(), "nested": [{"spanId": _SPAN_ID.hex()}]}
    assert otlp._hexify(node) == node


def test_an_unrecognisable_id_is_passed_through_not_mangled():
    assert otlp._hexify({"spanId": "not-an-id"}) == {"spanId": "not-an-id"}
