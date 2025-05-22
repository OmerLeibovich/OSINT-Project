from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketDisconnect
from pydantic import BaseModel
from services.theharvester import run_theHarvester
from services.amass import run_amass
from storage.sqlite import init_db, save_scan_to_db ,get_scan_history,delete_scan_by_id
import asyncio
import time

app = FastAPI()

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"]
)


class ScanRequest(BaseModel):
    domain: str
    source: str
    start_time: str
    end_time: str
    result: dict

def dedup_list(data):
    return list(dict.fromkeys(x.strip() for x in data if x and x.strip()))

@app.websocket("/scan/stream")
async def scan_websocket(websocket: WebSocket):
    await websocket.accept()
    data = await websocket.receive_json()
    domain = data["domain"]
    source = data.get("source", "bing")

    start_time = time.time()
    results = {
        "combined": {
            "subdomains": set(),
            "ips": set(),
            "emails": set(),
            "social_profiles": set()
        },
        "amass": None,
        "theHarvester": None
    }

    harvester_task = asyncio.create_task(run_theHarvester(domain, source))
    amass_task = asyncio.create_task(run_amass(domain))

    async def handle(name, task):
        try:
            result = await task

            if isinstance(result, list):
                result = {"subdomains": result, "ips": [], "emails": [], "social_profiles": []}

            for key in ["subdomains", "ips", "emails", "social_profiles"]:
                result[key] = dedup_list(result.get(key, []))
                results["combined"][key].update(result[key])

            results[name] = result

            await websocket.send_json({
                "source": name,
                "result": result,
                "duration": round(time.time() - start_time, 2),
                "combined": {
                    key: sorted(results["combined"][key])
                    for key in results["combined"]
                },
                "tools_completed": len([tool for tool in ["amass", "theHarvester"] if results[tool]])
            })

        except Exception as e:
            try:
                await websocket.send_json({"source": name, "error": str(e)})
            except (WebSocketDisconnect, RuntimeError):
                print(f"[{name}] WebSocket closed during error send.")

    await asyncio.gather(
        handle("theHarvester", harvester_task),
        handle("amass", amass_task)
    )

    try:
        await websocket.close()
    except RuntimeError:
        pass

@app.post("/save")
def save_scan(request: ScanRequest):
    try:
        save_scan_to_db(request.domain, request.source, request.start_time, request.end_time, request.result)
        return {"status": "saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
def get_history():
    try:
        data = get_scan_history()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.delete("/history/{scan_id}")
def delete_history_entry(scan_id: int):
    try:
        delete_scan_by_id(scan_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

