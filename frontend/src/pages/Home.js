import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {ReactAPI } from "../api";

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
    'otx', 'rapiddns', 'subdomainfinderc99', 'threatminer', 'urlscan'
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
  const res = await ReactAPI.deleteScan(id);
  if (!res.error) {
    setHistory(prev => prev.filter(entry => entry.id !== id));
  } else {
    console.error("Failed to delete entry:", res.error);
  }
}

 return (
  <div className="home-container">
    <div className="search-box">
      <header className="App-header">
       <h2 className='main_title'>
        OSINT Domain Scanner
      </h2>
        <input
          type="text"
          value={domain}
          onChange={e => setDomain(e.target.value.trim())}
          placeholder="Enter a domain (e.g. google.com)"
        />
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

        <button className="Button" onClick={onSearch}>Check Domain</button>
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

    {showHistory || window.innerWidth > 600 ? (
  <div className="history-box">
    <h3 style={{ marginTop: 0 }}>Scan History</h3>
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
