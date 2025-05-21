import subprocess
import re
import asyncio
import ipaddress

SUBDOMAIN_PATTERN = re.compile(r"([a-zA-Z0-9.-]+)\s+\(FQDN\)")
IPV4_PATTERN = re.compile(r"(\d{1,3}(?:\.\d{1,3}){3})\s+\(IPAddress\)")
IPV6_PATTERN = re.compile(r"(([a-fA-F0-9:]+))\s+\(IPAddress\)")


def _run_amass_sync(domain: str) -> dict:
    result = subprocess.run(
        ["amass", "enum", "-passive", "-d", domain,
         "-norecursive", "-timeout", "30", "-max-dns-queries", "100"],
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )

    subdomains = set()
    ips = set()

    for raw_line in result.stdout.splitlines():
        try:
            line = raw_line.decode("utf-8", errors="ignore").strip()
        except Exception:
            continue

        sub_match = SUBDOMAIN_PATTERN.search(line)
        if sub_match and not set(line) <= {"-", "="}:
            subdomain = sub_match.group(1)
            if subdomain.endswith(f".{domain}") and subdomain != domain:
                subdomains.add(subdomain)

        # IPים
        ip_match = re.search(r"([0-9a-fA-F:.]+)\s+\(IPAddress\)", line)
        if ip_match and not set(line) <= {"-", "="}:
            candidate_ip = ip_match.group(1)
            try:
                ipaddress.ip_address(candidate_ip)
                ips.add(candidate_ip)
            except ValueError:
                print(f"[!] Discarded invalid IP: {candidate_ip}")

    return {
        "subdomains": list(subdomains),
        "ips": list(ips),
        "emails": []
    }


async def run_amass(domain: str) -> dict:
    return await asyncio.to_thread(_run_amass_sync, domain)
