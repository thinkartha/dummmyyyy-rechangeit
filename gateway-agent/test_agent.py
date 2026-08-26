from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import agent


class AgentConfigTests(unittest.TestCase):
    def test_render_apisix_config_is_transparent(self) -> None:
        rendered = agent.render_apisix_config(
            {
                "id": "gw_test",
                "public_hostname": "api.customer.com",
                "origin": {
                    "scheme": "https",
                    "hostname": "customer-alb-123.amazonaws.com",
                    "port": 443,
                    "host_header": "api.customer.com",
                },
                "active_config_version": 7,
            }
        )

        self.assertNotIn("proxy-rewrite", rendered)
        for expected in (
            "host: api.customer.com",
            "scheme: https",
            "pass_host: rewrite",
            "upstream_host: api.customer.com",
            '"customer-alb-123.amazonaws.com:443": 1',
            "request-id: {}",
        ):
            self.assertIn(expected, rendered)
        agent.validate_apisix_config(rendered)

    def test_validate_apisix_config_rejects_path_rewrite(self) -> None:
        with self.assertRaises(ValueError):
            agent.validate_apisix_config(
                "routes:\n  - plugins:\n      proxy-rewrite: {}\n    upstream:\n      nodes: {}\n"
            )

    def test_write_state_persists_last_known_good(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            state_path = Path(tmp) / "gateway-state.json"
            state = agent.AgentState("gw_test", "gcred_test", 3)

            agent.write_state(state_path, state)

            self.assertEqual(agent.read_state(state_path), state)
            self.assertTrue((Path(tmp) / "last-known-good.json").exists())


if __name__ == "__main__":
    unittest.main()
