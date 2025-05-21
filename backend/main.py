from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketDisconnect
from services.theharvester import run_theHarvester
from services.amass import run_amass
import asyncio
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"]
)

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

            # עוטף אם זה רק רשימת תתי-דומיינים (כמו amass)
            if isinstance(result, list):
                result = {"subdomains": result, "ips": [], "emails": [], "social_profiles": []}

            # ניקוי כפילויות ועדכון התוצאות המשולבות
            for key in ["subdomains", "ips", "emails", "social_profiles"]:
                result[key] = dedup_list(result.get(key, []))
                results["combined"][key].update(result[key])

            # שמירת תוצאה לכלי
            results[name] = result

            try:
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
            except (WebSocketDisconnect, RuntimeError):
                print(f"[{name}] WebSocket already closed during send.")

        except Exception as e:
            try:
                await websocket.send_json({"source": name, "error": str(e)})
            except (WebSocketDisconnect, RuntimeError):
                print(f"[{name}] WebSocket already closed during error send.")

    await asyncio.gather(
        handle("theHarvester", harvester_task),
        handle("amass", amass_task)
    )

    try:
        await websocket.close()
    except RuntimeError:
        pass  # WebSocket כבר נסגר
