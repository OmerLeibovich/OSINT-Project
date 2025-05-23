# import subprocess
# import asyncio
# from subprocess import PIPE

# def run_theHarvester_sync(domain: str, source: str) -> dict:
#     process = subprocess.run(
#         ["poetry", "run", "python", "theHarvester.py", "-d", domain, "-b", source],
#         cwd="C:/Users/omerl/theHarvester",
#         stdout=PIPE,
#         stderr=PIPE
#     )

#     stdout = process.stdout
#     stderr = process.stderr

#     if stderr:
#         print(f"[stderr] {stderr.decode(errors='ignore')}")

#     lines = stdout.decode(errors="ignore").splitlines()


#     results = {
#         "subdomains": [],
#         "ips": [],
#         "emails": [],
#         "social_profiles":[]
#     }

#     current_section = None
#     for line in lines:
#         line = line.strip()

#         if not line or set(line) <= {"-", "="}:
#             continue


#         if line.startswith("[*] Hosts found:"):
#             current_section = "subdomains"
#         elif line.startswith("[*] IPs found:"):
#             current_section = "ips"
#         elif line.startswith("[*] Emails found:"):
#             current_section = "emails"
#         elif line.startswith("[*] people found:"):
#             current_section = "social_profiles"
#         elif line.startswith("[*]") or line.startswith("Target"):
#             current_section = None
#         elif current_section and line:
#             if current_section == "subdomains" and ":" in line:
#                 # פיצול לשם מארח ו־IP
#                 host, ip = map(str.strip, line.split(":", 1))
#                 results["subdomains"].append(host)
#                 results["ips"].append(ip)
#             else:
#                 results[current_section].append(line)

#     return results



# async def run_theHarvester(domain: str , source:str) -> str:
#     return await asyncio.to_thread(run_theHarvester_sync, domain ,source)


import subprocess
import asyncio
from subprocess import PIPE

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





  
 