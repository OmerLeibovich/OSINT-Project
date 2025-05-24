from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketDisconnect
from pydantic import BaseModel
from storage.sqlite import init_db, save_scan_to_db, get_scan_history, delete_scan_by_id
from services.scan_service import ScanService
from services.scan_strategies import AmassScanner, TheHarvesterScanner
import time
import uuid
import logging
import json

# Structured JSON logging
logger = logging.getLogger("scan_logger")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter(json.dumps({"time": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}))
handler.setFormatter(formatter)
logger.addHandler(handler)

app = FastAPI()
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://frontend:3000",
        "http://host.docker.internal:3000",
        "http://backend:5000",
    ],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Factory + Strategy Design Patterns
scan_service = ScanService({
    "amass": AmassScanner(),
    "theHarvester": TheHarvesterScanner()
})

class ScanRequest(BaseModel):
    domain: str
    source: str
    start_time: str
    end_time: str
    result: dict

@app.websocket("/scan")
async def scan_websocket(websocket: WebSocket):
    #  WebSocket endpoint that handles real-time OSINT scans.
    # Receives a JSON payload from the client with a domain and optional source (default is "bing").
    # Generates a unique scan ID and records the start time.
    # Uses the scan service to run all configured tools asynchronously (e.g. Amass, theHarvester).
    # Streams results back to the client as they come in, including progress info (tools completed, duration).
    # Logs key events (start, tool result, completion) in structured JSON format.
    # Closes the WebSocket connection when all tools are done.
    await websocket.accept()
    data = await websocket.receive_json()
    domain = data["domain"]
    source = data.get("source", "bing")

    scan_id = data.get("scan_id") or str(uuid.uuid4())
    start_time = time.time()
    tools_completed = 0

    logger.info(json.dumps({"event": "scan_started", "scan_id": scan_id, "domain": domain, "source": source}))

    async for msg in scan_service.run_all_stream(domain, source):
        tools_completed += 1
        msg["tools_completed"] = tools_completed
        msg["duration"] = round(time.time() - start_time, 2)
        msg["scan_id"] = scan_id
        await websocket.send_json(msg)

        logger.info(json.dumps({"event": "tool_result", "scan_id": scan_id, "tool": msg.get("source"), "duration": msg["duration"]}))

    await websocket.close()
    logger.info(json.dumps({"event": "scan_completed", "scan_id": scan_id, "duration": round(time.time() - start_time, 2)}))


@app.post("/save")
def save_scan(request: ScanRequest):
    # Saves a completed scan to the database.
    # Expects a ScanRequest object with domain, source, start/end time, and result.
    # On success, returns {"status": "saved"}.
    # If something goes wrong during saving, logs the error and returns a 500 response.
    try:
        save_scan_to_db(request.domain, request.source, request.start_time, request.end_time, request.result)
        return {"status": "saved"}
    except Exception as e:
        logger.error(json.dumps({"event": "save_failed", "error": str(e)}))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
def get_history():
    # Returns all saved scan records from the database.
    # If something goes wrong while fetching the history, logs the error and returns a 500 response.
    try:
        return get_scan_history()
    except Exception as e:
        logger.error(json.dumps({"event": "history_fetch_failed", "error": str(e)}))
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/history/{scan_id}")
def delete_history_entry(scan_id: int):
    # Deletes a specific scan record from the database by its ID.
    # Logs the deletion event. If something goes wrong, logs the error and returns a 500 response.
    try:
        delete_scan_by_id(scan_id)
        logger.info(json.dumps({"event": "scan_deleted", "scan_id": scan_id}))
        return {"status": "deleted"}
    except Exception as e:
        logger.error(json.dumps({"event": "delete_failed", "scan_id": scan_id, "error": str(e)}))
        raise HTTPException(status_code=500, detail=str(e))
