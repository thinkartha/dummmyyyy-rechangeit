"""Dependency / fault-tree graph the causal RCA traverses.

Two implementations behind one Protocol:
  - InMemoryServiceGraph — always available, used for dev/tests and as a fallback.
  - Neo4jServiceGraph — real graph-DB backing (the marquee substrate for causal RCA).
`get_service_graph` picks Neo4j when NEO4J_URI is configured and reachable, else in-memory.
"""

from __future__ import annotations

import logging
import os
from typing import Protocol, runtime_checkable

log = logging.getLogger("pinghold.pipeline.graph")


@runtime_checkable
class ServiceGraphProtocol(Protocol):
    entrypoint: str

    def downstream(self, service: str) -> list[str]: ...
    def depth(self, service: str) -> int: ...
    def path_to(self, service: str) -> list[str]: ...


class InMemoryServiceGraph:
    def __init__(self, edges: list[tuple[str, str]], entrypoint: str) -> None:
        self.edges = edges
        self.entrypoint = entrypoint
        self.nodes: set[str] = set()
        self._out: dict[str, list[str]] = {}
        for a, b in edges:
            self.nodes.add(a)
            self.nodes.add(b)
            self._out.setdefault(a, []).append(b)

    def downstream(self, service: str) -> list[str]:
        return list(self._out.get(service, []))

    def depth(self, service: str) -> int:
        if service == self.entrypoint:
            return 0
        seen = {self.entrypoint}
        frontier = [(self.entrypoint, 0)]
        while frontier:
            node, d = frontier.pop(0)
            for nxt in self._out.get(node, []):
                if nxt == service:
                    return d + 1
                if nxt not in seen:
                    seen.add(nxt)
                    frontier.append((nxt, d + 1))
        return 0

    def path_to(self, service: str) -> list[str]:
        if service == self.entrypoint:
            return [self.entrypoint]
        prev: dict[str, str] = {}
        seen = {self.entrypoint}
        frontier = [self.entrypoint]
        while frontier:
            node = frontier.pop(0)
            for nxt in self._out.get(node, []):
                if nxt in seen:
                    continue
                seen.add(nxt)
                prev[nxt] = node
                if nxt == service:
                    path = [service]
                    while path[-1] in prev:
                        path.append(prev[path[-1]])
                    return list(reversed(path))
                frontier.append(nxt)
        return [service]


class Neo4jServiceGraph:
    """Neo4j-backed graph. Edges are scoped per tenant via a `tenant` property.

    NOTE: implemented against the official `neo4j` driver but only exercised when a Neo4j instance
    is reachable; `get_service_graph` falls back to in-memory otherwise.
    """

    def __init__(self, driver, tenant: str, edges: list[tuple[str, str]], entrypoint: str) -> None:
        self._driver = driver
        self._tenant = tenant
        self.entrypoint = entrypoint
        with self._driver.session() as s:
            for a, b in edges:
                s.run(
                    "MERGE (x:Service {name:$a, tenant:$t}) "
                    "MERGE (y:Service {name:$b, tenant:$t}) "
                    "MERGE (x)-[:CALLS]->(y)",
                    a=a, b=b, t=tenant,
                )

    def downstream(self, service: str) -> list[str]:
        with self._driver.session() as s:
            rows = s.run(
                "MATCH (x:Service {name:$n, tenant:$t})-[:CALLS]->(y) RETURN y.name AS name",
                n=service, t=self._tenant,
            )
            return [r["name"] for r in rows]

    def depth(self, service: str) -> int:
        if service == self.entrypoint:
            return 0
        with self._driver.session() as s:
            rec = s.run(
                "MATCH p=shortestPath((a:Service {name:$e, tenant:$t})-[:CALLS*]->(b:Service {name:$n, tenant:$t})) "
                "RETURN length(p) AS d",
                e=self.entrypoint, n=service, t=self._tenant,
            ).single()
            return rec["d"] if rec else 0

    def path_to(self, service: str) -> list[str]:
        if service == self.entrypoint:
            return [self.entrypoint]
        with self._driver.session() as s:
            rec = s.run(
                "MATCH p=shortestPath((a:Service {name:$e, tenant:$t})-[:CALLS*]->(b:Service {name:$n, tenant:$t})) "
                "RETURN [x IN nodes(p) | x.name] AS names",
                e=self.entrypoint, n=service, t=self._tenant,
            ).single()
            return rec["names"] if rec else [service]


def get_service_graph(edges: list[tuple[str, str]], entrypoint: str, tenant: str = "default") -> ServiceGraphProtocol:
    uri = os.getenv("NEO4J_URI")
    if uri:
        try:
            from neo4j import GraphDatabase

            auth = (os.getenv("NEO4J_USER", "neo4j"), os.getenv("NEO4J_PASSWORD", ""))
            driver = GraphDatabase.driver(uri, auth=auth)
            driver.verify_connectivity()
            log.info("using Neo4j service graph at %s", uri)
            return Neo4jServiceGraph(driver, tenant, edges, entrypoint)
        except Exception as exc:  # pragma: no cover - depends on external infra
            log.warning("Neo4j unavailable (%s); falling back to in-memory graph", exc)
    return InMemoryServiceGraph(edges, entrypoint)
