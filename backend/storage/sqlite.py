import sqlite3
from typing import List

def init_db():
    conn = sqlite3.connect("scan_history.db")
    c = conn.cursor()
    c.execute('''
    CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain TEXT NOT NULL,
        source TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        subdomains TEXT,
        ips TEXT,
        emails TEXT,
        social_profiles TEXT
    )
''')
    conn.commit()
    conn.close()

def save_scan_to_db(domain: str, source: str, start_time: str, end_time: str, result: dict):
    subdomains = ",".join(result.get("subdomains", []))
    ips = ",".join(result.get("ips", []))
    emails = ",".join(result.get("emails", []))
    social_profiles = ",".join(result.get("social_profiles", []))

    conn = sqlite3.connect("scan_history.db")
    c = conn.cursor()
    c.execute('''
        INSERT INTO scans (domain, source, start_time, end_time, subdomains, ips, emails, social_profiles)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (domain, source, start_time, end_time, subdomains, ips, emails, social_profiles))
    conn.commit()
    conn.close()


def get_scan_history() -> List[dict]:
    conn = sqlite3.connect("scan_history.db")
    c = conn.cursor()
    c.execute('''
        SELECT id, domain, source, start_time, end_time, subdomains, ips, emails, social_profiles
        FROM scans ORDER BY id DESC
    ''')
    rows = c.fetchall()
    conn.close()

    return [
        {
            "id": row[0],
            "domain": row[1],
            "source": row[2],
            "start_time": row[3],
            "end_time": row[4],
            "subdomains": row[5].split(",") if row[5] else [],
            "ips": row[6].split(",") if row[6] else [],
            "emails": row[7].split(",") if row[7] else [],
            "social_profiles": row[8].split(",") if row[8] else []
        }
        for row in rows
    ]
def delete_scan_by_id(scan_id: int):
    conn = sqlite3.connect("scan_history.db")
    c = conn.cursor()
    c.execute("DELETE FROM scans WHERE id = ?", (scan_id,))
    conn.commit()
    conn.close()
