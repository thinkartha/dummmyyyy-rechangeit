"""Seed resource-usage until live usage flows from EP:collector/metrics."""

from __future__ import annotations

from .cost import ResourceUsage


def demo_usages() -> list[ResourceUsage]:
    return [
        ResourceUsage(
            component_id="payments-api", component_name="payments-api", namespace="prod",
            cpu_request=2.0, memory_request_mb=4096,
            cpu_usage=[0.35, 0.4, 0.38, 0.42, 0.41, 0.39, 0.37, 0.44, 0.4, 0.43, 0.5],
            memory_usage_mb=[900, 950, 980, 1010, 990, 1005, 970, 1020, 1000, 1015, 1100],
        ),
        ResourceUsage(
            component_id="checkout-svc", component_name="checkout-svc", namespace="prod",
            cpu_request=1.0, memory_request_mb=2048,
            cpu_usage=[0.2, 0.22, 0.21, 0.25, 0.24, 0.2, 0.23, 0.26, 0.22, 0.24, 0.3],
            memory_usage_mb=[420, 440, 430, 450, 460, 445, 435, 470, 455, 460, 500],
        ),
    ]
