import subprocess
import asyncio
from subprocess import PIPE


# This module handles integration with theHarvester tool.

# It provides two functions:
# run_theHarvester_sync(): a synchronous wrapper that executes theHarvester using subprocess,
# parses the output into a structured dict, and returns OSINT artifacts (subdomains, IPs, emails, social profiles).
# run_theHarvester(): an asynchronous wrapper that offloads the sync call to a thread using asyncio.to_thread().

# Execution:
# theHarvester is executed directly as a Python script from:
# /app/services/theharvester/theharvester.py
# with the following flags:
# `-d <domain>`: the domain to scan
# `-b <source>`: the data source to use (e.g., bing, crtsh, etc.)
# Example command:
# python theharvester.py -d example.com -b bing

# Output is parsed line-by-line based on recognizable section headers.

# Note:
# Lines like '[*] Hosts found:' define the section for parsing.
# If a subdomain line contains an IP (e.g., host: ip), both are extracted.
# Errors (stderr) are printed to console but not raised.

# This is part of the scan strategy system used to support multiple tools in parallel scans.

def run_theHarvester_sync(domain: str, source: str) -> dict:
    process = subprocess.run(
    [
      "python",
      "/app/services/theharvester/theharvester.py",
      "-d", domain,
      "-b", source
    ],
    stdout=PIPE,
    stderr=PIPE,
    )


    stdout = process.stdout
    stderr = process.stderr

    if stderr:
        print(f"[stderr] {stderr.decode(errors='ignore')}")

    lines = stdout.decode(errors="ignore").splitlines()


    results = {
        "subdomains": [],
        "ips": [],
        "emails": [],
        "social_profiles":[]
    }

    current_section = None
    for line in lines:
        line = line.strip()

        if not line or set(line) <= {"-", "="}:
            continue


        if line.startswith("[*] Hosts found:"):
            current_section = "subdomains"
        elif line.startswith("[*] IPs found:"):
            current_section = "ips"
        elif line.startswith("[*] Emails found:"):
            current_section = "emails"
        elif line.startswith("[*] people found:"):
            current_section = "social_profiles"
        elif line.startswith("[*]") or line.startswith("Target"):
            current_section = None
        elif current_section and line:
            if current_section == "subdomains" and ":" in line:
                host, ip = map(str.strip, line.split(":", 1))
                results["subdomains"].append(host)
                results["ips"].append(ip)
            else:
                results[current_section].append(line)

    return results



async def run_theHarvester(domain: str , source:str) -> str:
    return await asyncio.to_thread(run_theHarvester_sync, domain ,source)





  
 