from abc import ABC, abstractmethod
from services.amass import run_amass
from services.theharvester import run_theHarvester


# This module defines the strategy interface and concrete implementations for OSINT scanning tools.

# It uses the Strategy Design Pattern to provide a unified interface (`ScannerStrategy`)
# for different scanning tools like Amass and theHarvester. This enables flexible
# plug-and-play usage of scanners within the ScanService without tightly coupling the logic.

# Classes:
# ScannerStrategy: abstract base class defining the scan(domain, source) contract.
# AmassScanner: implementation that runs the Amass tool using run_amass().
# TheHarvesterScanner: implementation that runs theHarvester with the given domain and source.

# Note:
# All scan methods are asynchronous to allow concurrent scanning.
# `source` is used only by tools that support it (like theHarvester); it's optional for compatibility.


class ScannerStrategy(ABC):
    @abstractmethod
    async def scan(self, domain: str, source: str = None) -> dict:
        pass

class AmassScanner(ScannerStrategy):
    async def scan(self, domain: str, source: str = None) -> dict:
        return await run_amass(domain)

class TheHarvesterScanner(ScannerStrategy):
    async def scan(self, domain: str, source: str = None) -> dict:
        return await run_theHarvester(domain, source)
