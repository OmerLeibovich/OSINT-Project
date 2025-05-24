## Answers Sheet – OSINT Domain Scanner

### Additional Production-Grade Tests I Would Implement

1. **Input Validation Tests:**
   - Ensure the backend properly rejects malformed domains (e.g., no TLD, invalid characters).
   - Validate that missing or extra JSON keys in POST /save return appropriate error responses.

2. **WebSocket Error Handling:**
   - Simulate dropped connections or malformed WebSocket messages.
   - Ensure system recovers gracefully and logs errors.

3. **Concurrency Stress Tests:**
   - Simulate multiple concurrent scans to check for race conditions or bottlenecks.
   - Ensure DB writes don't conflict or corrupt.

4. **Frontend Integration Tests:**
   - Ensure correct rendering and updating of real-time scan data.
   - Simulate user flows including Excel export, modal views, and history interactions.

5. **Security Tests:**
   - Prevent injection attacks in domain field.
   - Ensure WebSocket connections validate expected structure.

---

### How I Would Benchmark & Optimise Performance

- **Tool Runtime Logging:**
  - Log start and end time of each tool separately (already partially done).
  - Profile average scan time per tool and source (e.g., bing vs crtsh).

- **Async Parallel Execution:**
  - Already using `asyncio` + `to_thread()` — would validate the thread pool isn’t limiting throughput.
  - Consider using `async subprocess` for Amass and `theHarvester` for better performance isolation.

- **Frontend Optimization:**
  - Lazy load history data on scroll or filter.
  - Reduce WebSocket overhead with message batching if needed.

- **Database Indexing:**
  - Index domain + timestamp columns in SQLite for faster history lookups and deletions.

---

### Known Bottlenecks & Mitigations

1. **Amass Tool:**
   - **Issue:** Amass takes a long time depending on network conditions and DNS resolution.
   - **Mitigation:** Use `-passive` and `-norecursive` flags (already applied).
   - **Further Step:** Cache or limit sources in production; allow source toggling.

2. **theHarvester:**
   - **Issue:** Some sources hang or timeout.
   - **Mitigation:** Timeout handling and parsing cleanup logic.
   - **Further Step:** Add timeouts at the subprocess level and improve section parsing logic.

3. **WebSocket Lifecycle:**
   - **Issue:** WebSocket errors are tricky to debug (e.g., partial data).
   - **Mitigation:** Add heartbeats and error acknowledgment messages.

---

Overall, the project supports testability and real-time scanning well.
Further improvements would focus on robustness and long-term scalability (e.g., Postgres, queue system, retries)