from shared.cloud import connections as c
from shared.cloud.connections import AzureConfig, GcpConfig


def test_gcp_round_trip_masks_the_key():
    cfg = GcpConfig.model_validate(
        {"projectId": "p1", "serviceAccountJson": '{"type":"service_account"}', "regions": ["us-central1"]}
    )
    assert c.save_config("t1", "gcp", cfg)["configured"] is True
    fields = c.config_status("t1", "gcp")["fields"]
    assert fields["project_id"] == "p1"
    assert fields["service_account_json"] == "***"
    assert fields["regions"] == "us-central1"


def test_azure_round_trip_masks_the_secret():
    cfg = AzureConfig.model_validate(
        {"subscriptionId": "sub", "azureTenantId": "ten", "clientSecret": "supersecretvalue"}
    )
    c.save_config("t2", "azure", cfg)
    fields = c.config_status("t2", "azure")["fields"]
    assert fields["subscription_id"] == "sub"
    assert fields["client_secret"] == "sup...lue"


def test_unconfigured_tenant_reports_not_connected():
    status = c.config_status("nobody", "gcp")
    assert status["configured"] is False
    assert status["source"] == "unset"
