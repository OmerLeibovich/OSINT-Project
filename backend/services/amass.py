import subprocess
import asyncio



# This module provides integration with the `amass` tool using passive enumeration mode.

# Functions:
# _run_amass_sync(): a synchronous function that executes the `amass enum` command with the given domain, filters the output, and returns extracted subdomains.
# run_amass(): an async wrapper around the sync function using asyncio.to_thread(), allowing non-blocking execution within async workflows.

# Execution:
# amass runs with the flags:
# `-d <domain>`: target domain
# `-passive`: passive mode (no active probing)
# `-norecursive`: avoid expanding discovered subdomains

# Output Parsing:
# Each line of output is decoded and checked to end with ".<domain>".
# Only subdomains are extracted; no IPs/emails/socials here, but the result dict is
# structured to match the expected unified format for scan tools.

# Note:
# This module is used as a part of the tool strategy system in parallel scans.
# `stderr` is suppressed to avoid clutter during normal execution.
 


def _run_amass_sync(domain: str) -> dict:
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
