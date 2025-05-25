import subprocess
import asyncio

    # Runs Subfinder synchronously to discover subdomains for a given domain.

    # Args:
    #  domain (str): The target domain to scan (e.g. example.com).

    # Returns:
    #  dict: A dictionary containing:
    # subdomains (list): All valid subdomains found by Subfinder.
    # ips (list): Empty (Subfinder doesn’t return IPs).
    # emails (list): Empty (not applicable for this tool).
    # social_profiles (list): Empty (not applicable for this tool).

    # Notes:
    # Only includes results that actually end with the given domain.
    # Uses subprocess safely without shell=True

def run_subfinder_sync(domain: str) -> list[str]:
        process = subprocess.run(
            ["subfinder", "-d", domain, "-silent"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
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

async def run_subfinder(domain: str) -> dict:
    return await asyncio.to_thread(run_subfinder_sync, domain)
