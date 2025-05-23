import subprocess
import re
import asyncio
import ipaddress

 


def _run_amass_sync(domain: str) -> dict:
    print("heyhey")
    process = subprocess.run(
    [
        "amass", "enum",
        "-d", domain,
        "-passive",
        "-norecursive"
    ],
    stdout=subprocess.PIPE,
    stderr=subprocess.DEVNULL,
)


    results = {
        "subdomains": [],
        "ips": [],
        "emails": [],
        "social_profiles":[]
    }


    for raw_line in process.stdout.splitlines():
        try:
            line = raw_line.decode("utf-8", errors="ignore").strip()
        except Exception:
            continue

        if line.strip().endswith(f".{domain}"):
            results["subdomains"].append(line)


    return results



async def run_amass(domain: str) -> dict:
    return await asyncio.to_thread(_run_amass_sync, domain)
