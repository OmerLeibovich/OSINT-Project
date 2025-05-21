import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [source, setSource] = useState('bing'); // ברירת מחדל
  const navigate = useNavigate();

  const sources = [
    'bing',
    'baidu',
    'brave',
    'duckduckgo',
    'crtsh',
    'hackertarget',
    'otx',
    'rapiddns',
    'sitedossier',
    'subdomainfinderc99',
    'threatminer',
    'urlscan',
  ];

  const onSearch = () => {
    if (!domain) return;
    navigate(`/results?domain=${encodeURIComponent(domain)}&source=${encodeURIComponent(source)}`);
  };

  return (
    <div className="App">
      <header className="App-header">
        <input
          type="text"
          value={domain}
          onChange={e => setDomain(e.target.value.trim())}
          placeholder="Enter a domain (e.g. google.com)"
        />

        <select value={source} onChange={e => setSource(e.target.value)}>
          {sources.map(src => (
            <option key={src} value={src}>
              {src}
            </option>
          ))}
        </select>

        <button className="Button" onClick={onSearch}>
          Check Domain
        </button>
      </header>
    </div>
  );
}
