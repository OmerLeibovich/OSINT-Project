## Answers Sheet – OSINT Domain Scanner

### Additional Production-Grade Tests I Would Implement

1. Input Validation Tests:
   - Ensure the backend rejects malformed or malicious domains (e.g., `http://`, missing TLDs).
   - Validate missing/invalid keys in POST `/save` return 422 or meaningful errors.

2. WebSocket Robustness Tests:
   - Simulate dropped WebSocket connections mid-scan.
   - Send malformed or incomplete messages and assert proper logging and stability.

3. Concurrency & Race Condition Tests:
   - Trigger parallel scans with same domain but different sources to ensure thread safety.
   - Check SQLite commit consistency and scan ID isolation under load.

4. Subfinder-Specific Test:
   - Verify that Subfinder returns proper subdomain format.
   - Validate deduplication logic when overlapping data comes from multiple tools.

5. UI Integration Tests:
   - Ensure live result updates from all 3 tools are shown progressively.
   - Test the modal window and Excel export flows for completeness.

6. Security-Focused Tests:
   - Sanitize all input before using in subprocesses (already safe by avoiding shell=True).
   - Validate that no tool result can inject code into frontend or DB.

---

### How I Would Benchmark & Optimise Performance

- Timing Each Tool:
  - Track and log tool runtime independently (`start`, `end`, `duration`) with structured logs.
  - Analyze median and P95 execution time per tool (e.g., Subfinder typically fastest).

- Concurrency Improvements:
  - Explore `asyncio.create_subprocess_exec()` instead of `to_thread()` where possible (especially for Amass).
  - Parallelize file I/O and DB commits if needed (currently non-blocking via FastAPI).

- React UI Enhancements:
  - Consider debounce or loading skeletons for smoother UX during scans.
  - Load history only when modal is opened (lazy load).

- Database Optimization:
  - Add indexes on `domain`, `start_time`, and `scan_id` in SQLite.
  - Consider moving to PostgreSQL for large-scale or concurrent users.

---

### Known Bottlenecks & Mitigations

#### 1. Amass
   - Bottleneck: Long runtime (up to 30s+) due to DNS enumeration.
   - Mitigation: Use passive mode only (`-passive`), skip brute-force in MVP.

#### 2. theHarvester
   - Bottleneck: Inconsistent output parsing and hangs on some sources.
   - Mitigation: Parse only JSON-safe results and use strict timeout in subprocess.

#### 3. Subfinder
   - Bottleneck: Quick, but no IP/email/profile info.
   - Mitigation: Useful for coverage – results are merged but clearly flagged.

#### 4. WebSocket Fragility
   - Bottleneck: If client disconnects, backend needs to handle cleanup.
   - Mitigation: Use `try/except WebSocketDisconnect` and structured error logs.

---

### Summary

The system is scalable, modular, and already includes design patterns (Strategy + Factory).  
Adding Subfinder improves discovery coverage with minimal overhead.

For production, I would prioritize:
- Switching to PostgreSQL
- Adding distributed queue support (e.g., Celery or background workers)
- Centralized logging (e.g., with ELK or Loki)

