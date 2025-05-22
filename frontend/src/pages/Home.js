import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const [domain, setDomain] = useState('')
  const [source, setSource] = useState('bing')
  const [history, setHistory] = useState([])
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600)
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  const sources = [
    'bing', 'baidu', 'brave', 'duckduckgo', 'crtsh', 'hackertarget',
    'otx', 'rapiddns', 'sitedossier', 'subdomainfinderc99', 'threatminer', 'urlscan'
  ]

  const extractDomain = (input) => {
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    const hostname = url.hostname;
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch (e) {
    return null;
  }
};


  useEffect(() => {
    fetch("http://localhost:8000/history")
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.error("Failed to fetch history:", err))
    const handleResize = () => setIsMobile(window.innerWidth < 600)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

 const onSearch = () => {
  if (!domain) return;

  const cleanedDomain = extractDomain(domain);
  const domainPattern = /^(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/;



  if (!cleanedDomain || !domainPattern.test(cleanedDomain)) {
    alert("Please enter a valid domain.");
    return;
  }

  navigate(`/results?domain=${encodeURIComponent(cleanedDomain)}&source=${encodeURIComponent(source)}`);
};


  const deleteEntry = async (id) => {
    await fetch(`http://localhost:8000/history/${id}`, { method: 'DELETE' })
    setHistory(prev => prev.filter(entry => entry.id !== id))
  }

 return (
  <div className="home-container">
    {/* טופס חיפוש */}
    <div className="search-box">
      <header className="App-header">
        <input
          type="text"
          value={domain}
          onChange={e => setDomain(e.target.value.trim())}
          placeholder="Enter a domain (e.g. google.com)"
        />
        <select
          value={source}
          onChange={e => setSource(e.target.value)}
          className='select_Button'
        >
          {sources.map(src => (
            <option key={src} value={src}>{src}</option>
          ))}
        </select>
        <button className="Button" onClick={onSearch}>Check Domain</button>
        {isMobile && (
        <button
            className="Button"
            onClick={() => setShowHistory(prev => !prev)}
        >
            {showHistory ? (
            <>Hide History <span style={{ fontSize: '16px' }}>▲</span></>
            ) : (
            <>Show History <span style={{ fontSize: '16px' }}>▼</span></>
            )}
        </button>
        )}
      </header>
    </div>

    {showHistory || window.innerWidth > 600 ? (
  <div className="history-box">
    <h3 style={{ marginTop: 0 }}>Scan History</h3>
    {Array.isArray(history) && history.length === 0 ? (
      <p>No scan history found.</p>
    ) : Array.isArray(history) ? (
      <ul style={{ paddingLeft: '1rem' }}>
        {history.map(entry => (
          <li key={entry.id} style={{ marginBottom: '0.8rem' }}>
            <strong>{entry.domain}</strong><br />
            <em>{entry.source}</em><br />
            <small>{entry.start_time} → {entry.end_time}</small><br />
            <button onClick={() => { setSelectedEntry(entry); setModalOpen(true); }} style={{ marginTop: '0.3rem', marginRight: '0.5rem' }}>View</button>
            <button onClick={() => deleteEntry(entry.id)} style={{ color: 'red' }}>Delete</button>
          </li>
        ))}
      </ul>
    ) : (
      <p style={{ color: 'red' }}>Error loading history.</p>
    )}
  </div>
) : null}


    {/* מודאל */}
    {modalOpen && selectedEntry && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Details for {selectedEntry.domain}</h3>
          <p><strong>Source:</strong> {selectedEntry.source}</p>
          <p><strong>Start:</strong> {selectedEntry.start_time}</p>
          <p><strong>End:</strong>  {selectedEntry.end_time}</p>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {selectedEntry.subdomains?.length > 0 && (
              <div style={{ flex: 1, minWidth: '200px' }}>
                <strong>Subdomains</strong>
                <ul>{selectedEntry.subdomains.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}

            {selectedEntry.ips?.length > 0 && (
              <div style={{ flex: 1, minWidth: '200px' }}>
                <strong>IPs</strong>
                <ul>{selectedEntry.ips.map((ip, i) => <li key={i}>{ip}</li>)}</ul>
              </div>
            )}

            {selectedEntry.emails?.length > 0 && (
              <div style={{ flex: 1, minWidth: '200px' }}>
                <strong>Emails</strong>
                <ul>{selectedEntry.emails.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </div>
            )}

            {selectedEntry.social_profiles?.length > 0 && (
              <div style={{ flex: 1, minWidth: '200px' }}>
                <strong>Social Profiles</strong>
                <ul>{selectedEntry.social_profiles.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            )}
          </div>

          <button onClick={() => setModalOpen(false)} style={{ marginTop: '1rem' }}>Close</button>
        </div>
      </div>
    )}
  </div>
)
}
