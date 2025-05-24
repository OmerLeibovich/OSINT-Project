import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx';
import { connectToScanWebSocket, ReactAPI } from "../api";

 
// This component is responsible for displaying the live scan progress and final results
// of an OSINT scan initiated by the user. It connects to the backend via WebSocket,
// receives partial results from tools (theHarvester and Amass), and renders a
// real-time summary. After the scan completes, users can review details or export
// the results to Excel. 



export default function Results() {
  // State hooks
  const [searchParams] = useSearchParams()
  const domain = searchParams.get('domain')
  const source = searchParams.get('source')
  const scan_id = searchParams.get('scan_id')
  const [tools, setTools] = useState({
    theHarvester: { started: new Date(), result: null, ended: null },
    amass: { started: new Date(), result: null, ended: null }
  })
  const [combined, setCombined] = useState(null)
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()
  const [, forceRerender] = useState(0)



// Forces component to re-render every second to show live scan durations
  useEffect(() => {
    const interval = setInterval(() => forceRerender(n => n + 1), 1000)
    return () => clearInterval(interval)
  }, [])

 // Export scan results as Excel file using xlsx
  const exportToExcel = () => {
    if (!combined) return;

    const rows = [
      ...(combined.subdomains || []).map(item => ({ type: 'Subdomain', value: item })),
      ...(combined.ips || []).map(item => ({ type: 'IP', value: item })),
      ...(combined.emails || []).map(item => ({ type: 'Email', value: item })),
      ...(combined.social_profiles || []).map(item => ({ type: 'Social Profile', value: item })),
    ]

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scan Results")

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const filename = `scan_${domain.replace(/\./g, "_")}_${timestamp}_${source}.xlsx`;
    XLSX.writeFile(workbook, filename)

    console.log(JSON.stringify({
      event: "export_to_excel",
      domain,
      source,
      row_count: rows.length,
      timestamp: new Date().toISOString()
    }))

  }

 // Initiates WebSocket connection and listens for scan result updates
  useEffect(() => {
  if (!domain) {
    navigate('/')
    return
  }

  const start = new Date()
  const startStr = start.toLocaleString()
  setStartTime(startStr)

  const ws = connectToScanWebSocket(domain, source, scan_id, (msg) => {
  const now = new Date();

  console.log(JSON.stringify({
    event: "tool_result_received",
    tool: msg.source,
    scan_id: msg.scan_id,
    timestamp: now.toISOString(),
    result_preview: {
      subdomains: msg.result?.subdomains?.length,
      ips: msg.result?.ips?.length,
      emails: msg.result?.emails?.length,
      social_profiles: msg.result?.social_profiles?.length,
    }
  }));

  setTools(prev => {
    const updated = {
      ...prev,
      [msg.source]: {
        ...prev[msg.source],
        result: msg.result,
        ended: now
      }
    };

    const finished = Object.values(updated).filter(t => t.result).length;
    if (finished === 2) {
      const endStr = now.toLocaleString();
      setEndTime(endStr);

        console.log(JSON.stringify({
        event: "scan_completed",
        scan_id: msg.scan_id,
        domain,
        source,
        total_duration_seconds: Math.floor((now - start) / 1000),
        timestamp: now.toISOString()
      }));


      ReactAPI.saveScan({
        domain,
        source,
        start_time: startStr,
        end_time: endStr,
        result: msg.combined
      });
    }

    return updated;
  });

  setCombined(msg.combined);
});
   

    return () => ws.close()
  }, [])

  return (
    <div style={{ padding: '1rem' }}>
    {/* Header section with scan summary */}
      <div className="scan-summary-container">
        <h2>Scan Summary</h2>
        <p><strong>Domain:</strong> {domain}</p>
        <p><strong>TheHarvester source:</strong> {source}</p>
        <p><strong>Started:</strong> {startTime}</p>
        {endTime && <p><strong>Finished:</strong> {endTime}</p>}
         {/* Show scan summary after completion */}
        {combined && (
          <>
            <p>
              <strong>Summary:</strong> {combined.subdomains?.length || 0} subdomains,
              {combined.ips?.length || 0} IPs,
              {combined.emails?.length || 0} emails,
              {combined.social_profiles?.length || 0} social_profiles
            </p>
            <div className="centered-buttons">
              <button onClick={() => setShowModal(true)}>View Details</button>
              <button onClick={exportToExcel}>
                Export to Excel
              </button>
            </div>
          </>
        )}
      </div>
      {/* Tool-specific scan results */}
      <h3 className='tool_response'>Tool Responses</h3>
      {Object.entries(tools).map(([tool, data], i) => {
        const duration = data.started ? Math.floor(((data.ended || new Date()) - new Date(data.started)) / 1000) : 0
        return (
          <div
            key={i}
            className="tool-background"
          >
            <h4>{tool}</h4>
            {data.result ? (
              <pre className='results' >
                {JSON.stringify(data.result, null, 2)}
              </pre>
            ) : (
              <p><em>Waiting for results...</em></p>
            )}
            <p><strong>Duration:</strong> {duration}s</p>
          </div>
        )
      })}
      {/* Back navigation */}
      <button onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>Back</button>
      {/* Modal with full result list */}
      {showModal && combined && (
        <div className='full_details_background'>
          <div className='full_details'>
          <div className="modal-header">
          <h2>Full Results for {domain}</h2>
          <button onClick={() => setShowModal(false)} style={{ color: 'red' }}>Close</button>
          </div>

          <div className='summery_background'>
          <div className='summery_item'>
            <h4>Subdomains</h4>
            <ul>{combined.subdomains?.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <div className='summery_item'>
            <h4>IPs</h4>
            <ul>{combined.ips?.map((ip, i) => <li key={i}>{ip}</li>)}</ul>
          </div>
          <div className='summery_item'>
            <h4>Emails</h4>
            <ul>{combined.emails?.map((email, i) => <li key={i}>{email}</li>)}</ul>
          </div>
          <div className='summery_item'>
            <h4>social_profiles</h4>
            <ul>{combined.social_profiles?.map((social, i) => <li key={i}>{social}</li>)}</ul>
          </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
