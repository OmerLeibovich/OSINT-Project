import json
import pytest
import websockets


# Test module for verifying the functionality of the WebSocket scan endpoint (/scan).

# This test simulates a real scan request via WebSocket by sending a domain and data source,
# then listens for results from both integrated OSINT tools (amass and theHarvester).

# It validates:
# That both tools responded.
# That the combined result includes the expected keys (subdomains and IPs).
# That the data types of returned artifacts are as expected (lists).

# Uses:
# pytest with asyncio support
# websockets for client-side WebSocket communication

@pytest.mark.asyncio
async def test_websocket_scan():
    uri = "ws://localhost:5000/scan"
    async with websockets.connect(uri) as websocket:
        await websocket.send(json.dumps({
            "domain": "nmap.org",
            "source": "rapiddns"
        }))

       
        responses = []
        for _ in range(2):  
            message = await websocket.recv()
            data = json.loads(message)
            responses.append(data)

        assert any(r["source"] == "amass" for r in responses)
        assert any(r["source"] == "theHarvester" for r in responses)

        for r in responses:
            assert "combined" in r
            assert isinstance(r["combined"]["subdomains"], list)
            assert isinstance(r["combined"]["ips"], list)
