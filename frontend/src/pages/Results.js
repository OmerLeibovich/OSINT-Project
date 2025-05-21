import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx';


export default function Results() {
  const [searchParams] = useSearchParams()
  const domain = searchParams.get('domain')
  const source = searchParams.get('source') || 'bing'
  const [updates, setUpdates] = useState([])
  const [combined, setCombined] = useState(null)
  const [loading, setLoading] = useState(true)
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [toolsCompleted, setToolsCompleted] = useState(0)
  const navigate = useNavigate()

    const exportToExcel = () => {
    if (!combined) return;

    const rows = [
        ...(combined.subdomains || []).map(item => ({ type: 'Subdomain', value: item })),
        ...(combined.ips || []).map(item => ({ type: 'IP', value: item })),
        ...(combined.emails || []).map(item => ({ type: 'Email', value: item })),
        ...(combined.social_profiles || []).map(item => ({ type: 'Social Profile', value: item })),
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scan Results");

    const filename = `scan_${domain.replace(/\./g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
    };

  useEffect(() => {
    if (!domain) {
      navigate('/')
      return
    }

    setStartTime(new Date().toLocaleString())

    const ws = new WebSocket("ws://127.0.0.1:8000/scan/stream")

    ws.onopen = () => {
      ws.send(JSON.stringify({ domain, source }))
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      setUpdates(prev => [...prev, msg])
      setCombined(msg.combined)
      setEndTime(new Date().toLocaleString())
      setToolsCompleted(msg.tools_completed)
      setLoading(false)
    }

    ws.onerror = (err) => {
      console.error("WebSocket error:", err)
    }

    return () => ws.close()
  }, [domain, source, navigate])

  if (loading) return <p>Scanning {domain}...</p>

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Scan Summary</h2>
      <p><strong>Domain:</strong> {domain}</p>
      <p><strong>TheHarvester source:</strong> {source}</p>
      <p><strong>Started:</strong> {startTime}</p>
        {toolsCompleted === 2 && (
        <p><strong>Finished:</strong> {endTime}</p>
        )}


      {combined && (
        <>
          <p>
            <strong>Summary:</strong> {combined.subdomains?.length || 0} subdomains, {combined.ips?.length || 0} IPs, {combined.emails?.length || 0} emails, {combined.social_profiles?.length || 0} social_profiles
          </p>
          <button onClick={() => setShowModal(true)}>View Details</button>
          <button onClick={exportToExcel}>
            Export to Excel
            </button>


        </>
      )}

      <h3 className='tool_response'>Tool Responses</h3>
      {updates.map((u, i) => (
        <div key={i} className="tool-background">
          <h4>{u.source}</h4>
          <pre className='results'>
            {JSON.stringify(u.result, null, 2)}
          </pre>
          <p><strong>Duration:</strong> {u.duration}s</p>
        </div>
      ))}

      <button onClick={() => navigate('/')}>Back</button>
      

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
             <ul>{combined.social_profiles?.map((social_profiles, i) => <li key={i}>{social_profiles}</li>)}</ul>

            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
