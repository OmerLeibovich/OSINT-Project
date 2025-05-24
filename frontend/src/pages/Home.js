import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {ReactAPI } from "../api";
import { v4 as uuidv4 } from 'uuid';


// Home component – entry point for initiating OSINT scans.
//  Functionality:
//  - Lets the user enter a domain and select aHarvester source.
//  - Validates the domain and redirects to the /results page with query parameters.
//  - Fetches and displays scan history from the backend.
//  - Generates a unique scan_id (UUID) on the client side for traceability.
//  - Allows viewing and deleting past scans.
//  Used hooks:
//  - useState for managing domain input, history, modal state, etc.
//  - useEffect to fetch history on mount and handle screen resize.
//  Notable features:
//  - Responsive behavior for mobile (toggle scan history display).
//  - Structured console logs for actions (scan started, validation failed, etc.).


export default function Home() {
  // State hooks
  const [domain, setDomain] = useState('')
  const [source, setSource] = useState('bing')
  const [history, setHistory] = useState([])
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600)
  const [modalOpen, setModalOpen] = useState(false)
  const [scanId] = useState(uuidv4()); // Unique scan ID for tracking

  const navigate = useNavigate()
  // Supported sources for theHarvester
  const sources = [
    'bing', 'baidu', 'brave', 'duckduckgo', 'crtsh', 'hackertarget',
    'otx', 'rapiddns', 'subdomainfinderc99', 'threatminer', 'urlscan'
  ]

  //  Attempts to extract a clean domain from user input.
  //  @param {string} input - raw user input (may include protocol or www.)
  //  @returns {string|null} - cleaned domain or null if invalid
  const extractDomain = (input) => {
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    const hostname = url.hostname;
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch (e) {
    return null;
  }
};

  // Fetch scan history on first load, and handle screen resize for mobile toggle.
  useEffect(() => {
    ReactAPI.getHistory()
  .then(data => {
    if (!data.error) {
      setHistory(data)
    } else {
      console.error("Failed to fetch history:", data.error)
    }
  })
  .catch(err => console.error("Failed to fetch history:", err))
    const handleResize = () => setIsMobile(window.innerWidth < 600)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])


  // Triggered when user clicks "Check Domain".
  //  Validates domain format and navigates to /results with query params.
  //  Also logs scan start event with structured console log.
 const onSearch = () => {
  try {
    if (!domain) return;

    const cleanedDomain = extractDomain(domain);
    const domainPattern = /^(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/;

    if (!cleanedDomain || !domainPattern.test(cleanedDomain)) {
      alert("Please enter a valid domain.");
      console.error(JSON.stringify({
        event: "invalid_domain",
        scan_id: scanId,
        domain: domain,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    console.log(JSON.stringify({
      event: "scan_initiated",
      scan_id: scanId,
      domain: cleanedDomain,
      source,
      timestamp: new Date().toISOString()
    }));

    navigate(`/results?domain=${encodeURIComponent(cleanedDomain)}&source=${encodeURIComponent(source)}&scan_id=${scanId}`);
  } catch (err) {
    console.error(JSON.stringify({
      event: "scan_initiation_failed",
      scan_id: scanId,
      error: err.message,
      timestamp: new Date().toISOString()
    }));
    alert("Something went wrong. Please try again.");
  }
};



// Deletes a scan entry by ID and removes it from the local history state.
const deleteEntry = async (id) => {
  const res = await ReactAPI.deleteScan(id);
  if (!res.error) {
    setHistory(prev => prev.filter(entry => entry.id !== id));
  } else {
    console.error("Failed to delete entry:", res.error);
  }
}

 return (
  <div className="home-container">
  {/* Search section with input + source selector */}
    <div className="search-box">
      <header className="App-header">
       <h2 className='main_title'>
        OSINT Domain Scanner
      </h2>
        {/* Domain input field */}
        <input
          type="text"
          value={domain}
          onChange={e => setDomain(e.target.value.trim())}
          placeholder="Enter a domain (e.g. google.com)"
        />
        {/* Source selection for theHarvester */}
        <span className='source_title'>
          Select a source for theHarvester:
        </span>
        <select
          value={source}
          onChange={e => setSource(e.target.value)}
          className='select_Button'
        >
          {sources.map(src => (
            <option key={src} value={src}>{src}</option>
          ))}
        </select>
          {/* Trigger scan */}
        <button className="Button" onClick={onSearch}>Check Domain</button>
        {/* Toggle history (for mobile view) */}
        {isMobile && (
        <button
            className="Button"
            onClick={() => setShowHistory(prev => !prev)}
        >
            {showHistory ? (
            <>Hide History <span>▲</span></>
            ) : (
            <>Show History <span>▼</span></>
            )}
        </button>
        )}
      </header>
    </div>
     {/* History section – shows previous scan records */}
    {showHistory || window.innerWidth > 600 ? (
  <div className="history-box">
    <h3 style={{ marginTop: 0 }}>Scan History</h3>
    {/* No history case */}
    {Array.isArray(history) && history.length === 0 ? (
      <p>No scan history found.</p>
    ) : Array.isArray(history) ? (
      <ul >
        {history.map(entry => (
          <li key={entry.id}>
            <strong>{entry.domain}</strong><br />
            <em>{entry.source}</em><br />
            <small>{entry.start_time} → {entry.end_time}</small><br />
            <button onClick={() => { setSelectedEntry(entry); setModalOpen(true); }} className='view_Button'>View</button>
            <button onClick={() => deleteEntry(entry.id)} style={{ color: 'red' }}>Delete</button>
          </li>
        ))}
      </ul>
    ) : (
      <p style={{ color: 'red' }}>Error loading history.</p>
    )}
  </div>
) : null}

    {/* Modal for viewing full scan details */}
    {modalOpen && selectedEntry && (
      <div className="modal-overlay">
        <div className="modal-content">
         <div className="modal-header">
        <h3>Details for {selectedEntry.domain}</h3>
        <button onClick={() => setModalOpen(false)} style={{ color: 'red' }}>Close</button>
      </div>
          <p><strong>Source:</strong> {selectedEntry.source}</p>
          <p><strong>Start:</strong> {selectedEntry.start_time}</p>
          <p><strong>End:</strong>  {selectedEntry.end_time}</p>

          {/* Detailed data blocks */}
          <div className='summery_background'>
            {selectedEntry.subdomains?.length > 0 && (
              <div className='summery_item'>
                <strong>Subdomains</strong>
                <ul>{selectedEntry.subdomains.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}

            {selectedEntry.ips?.length > 0 && (
              <div className='summery_item'>
                <strong>IPs</strong>
                <ul>{selectedEntry.ips.map((ip, i) => <li key={i}>{ip}</li>)}</ul>
              </div>
            )}

            {selectedEntry.emails?.length > 0 && (
              <div className='summery_item'>
                <strong>Emails</strong>
                <ul>{selectedEntry.emails.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </div>
            )}

            {selectedEntry.social_profiles?.length > 0 && (
              <div className='summery_item'>
                <strong>Social Profiles</strong>
                <ul>{selectedEntry.social_profiles.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
)
}
