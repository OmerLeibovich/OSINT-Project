import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from fastapi.testclient import TestClient
from main import app



# Integration tests for FastAPI endpoints:
# /save (POST)
# /history (GET)
# /history/{id} (DELETE)

# These tests use FastAPI's TestClient to simulate HTTP requests to the API,
# and ensure that the core scan persistence and retrieval routes behave as expected.

# Covers:
# Saving a valid scan
# Handling invalid/missing fields
# Fetching scan history
# Deleting a scan (even non-existing ID)

# Note:
# The database used is whatever is initialized via init_db() in main.py.
# The tests do not mock the DB layer, so they are integration-level.


client = TestClient(app)

def test_save_scan_success():
    payload = {
        "domain": "example.com",
        "source": "bing",
        "start_time": "2024-01-01 00:00:00",
        "end_time": "2024-01-01 00:10:00",
        "result": {
            "subdomains": ["a.example.com"],
            "ips": ["1.1.1.1"],
            "emails": ["info@example.com"],
            "social_profiles": ["https://twitter.com/example"]
        }
    }
    response = client.post("/save", json=payload)
    assert response.status_code == 200
    assert response.json() == {"status": "saved"}

def test_save_scan_missing_field():
    payload = {
        "domain": "example.com",
        "source": "bing"
    }
    response = client.post("/save", json=payload)
    assert response.status_code == 422

def test_get_history():
    response = client.get("/history")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_delete_non_existing_scan():
    response = client.delete("/history/999999")
    assert response.status_code == 200
    assert response.json() == {"status": "deleted"}
