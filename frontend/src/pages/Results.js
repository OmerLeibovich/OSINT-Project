import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx';

export default function Results() {
  const [searchParams] = useSearchParams()
  const domain = searchParams.get('domain')
  const source = searchParams.get('source') || 'bing'
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

  useEffect(() => {
    const interval = setInterval(() => forceRerender(n => n + 1), 1000)
    return () => clearInterval(interval)
  }, [])

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
  }

  useEffect(() => {
  if (!domain) {
    navigate('/')
    return
  }

  const start = new Date()
  const startStr = start.toLocaleString()
  setStartTime(startStr)

  const ws = new WebSocket("ws://127.0.0.1:8000/scan/stream")

  ws.onopen = () => {
    ws.send(JSON.stringify({ domain, source }))
  }

  ws.onmessage = async (event) => {
    const msg = JSON.parse(event.data)
    const now = new Date()

    setTools(prev => {
      const updated = {
        ...prev,
        [msg.source]: {
          ...prev[msg.source],
          result: msg.result,
          ended: now
        }
      }

      const finished = Object.values(updated).filter(t => t.result).length
      if (finished === 2) {
        const endStr = now.toLocaleString()
        setEndTime(endStr)
        saveScanResult(domain, source, startStr, endStr, msg.combined)
      }

      return updated
    })

    setCombined(msg.combined)
  }    
   async function saveScanResult(domain, source, startTime, endTime, combined) {
        try {
            await fetch("http://127.0.0.1:8000/save", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                domain,
                source,
                start_time: startTime,
                end_time: endTime,
                result: combined
            })
            })
        } catch (err) {
            console.error("Failed to save scan result:", err)
        }
        }



    ws.onerror = (err) => {
      console.error("WebSocket error:", err)
    }

    return () => ws.close()
  }, [domain, source, navigate])

  return (
    <div style={{ padding: '1rem' }}>
      <div className="scan-summary-container">
        <h2>Scan Summary</h2>
        <p><strong>Domain:</strong> {domain}</p>
        <p><strong>TheHarvester source:</strong> {source}</p>
        <p><strong>Started:</strong> {startTime}</p>
        {endTime && <p><strong>Finished:</strong> {endTime}</p>}

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

      <button onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>Back</button>

      {showModal && combined && (
        <div className='full_details_background'>
          <div className='full_details'>
            <h2>Full Results for {domain}</h2>

            <h4>Subdomains</h4>
            <ul>{combined.subdomains?.map((s, i) => <li key={i}>{s}</li>)}</ul>

            <h4>IPs</h4>
            <ul>{combined.ips?.map((ip, i) => <li key={i}>{ip}</li>)}</ul>

            <h4>Emails</h4>
            <ul>{combined.emails?.map((email, i) => <li key={i}>{email}</li>)}</ul>

            <h4>social_profiles</h4>
            <ul>{combined.social_profiles?.map((social, i) => <li key={i}>{social}</li>)}</ul>

            <button onClick={() => setShowModal(false)} style={{ marginTop: "1rem" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
