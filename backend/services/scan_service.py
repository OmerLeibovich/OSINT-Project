import asyncio
from services.scan_strategies import ScannerStrategy


# This module defines the ScanService class, which manages execution of multiple OSINT scanners in parallel.

# The service uses the provided scanner strategy implementations (e.g., AmassScanner, TheHarvesterScanner)
# and runs them concurrently via asyncio. Each tool's result is combined into a unified structure.

# Components:
# dedup_list(): utility function to clean and deduplicate list entries.
# ScanService: main class that coordinates all scanning tools.

# Methods:
# __init__(scanners): receives a dict of tool name → scanner strategy.
# run_all_stream(domain, source): runs all scanners concurrently and yields their results as they arrive.

# Output structure per tool:
# {
#   "source": "amass" | "theHarvester",
#   "result": {...},                # raw result from the tool
#   "combined": {...}               # merged & deduplicated results from all tools up to this point
# }

# Note:
# Uses asyncio.as_completed to yield tool results as they finish (not necessarily in order).
# Handles errors gracefully per scanner and reports them back in the yielded dict.


def dedup_list(data):
    return list(dict.fromkeys(x.strip() for x in data if x and x.strip()))

class ScanService:
    def __init__(self, scanners: dict[str, ScannerStrategy]):
        self.scanners = scanners

    async def run_all_stream(self, domain: str, source: str):
        combined = {k: set() for k in ["subdomains", "ips", "emails", "social_profiles"]}

        async def handle(name, scanner):
            try:
                result = await scanner.scan(domain, source)
                for key in combined:
                    result[key] = dedup_list(result.get(key, []))
                    combined[key].update(result[key])

                return {
                    "source": name,
                    "result": result,
                    "combined": {k: sorted(combined[k]) for k in combined}
                }
            except Exception as e:
                return {"source": name, "error": str(e)}


        coros = [handle(name, scanner) for name, scanner in self.scanners.items()]
        for future in asyncio.as_completed(coros):
            result = await future
            yield result


