import { config_Api } from "./config";


//  Generic helper function for sending HTTP requests to the backend.

//  @param {string} baseUrl - The base URL of the API (e.g., http://localhost:5000).
//  @param {string} endpoint - API endpoint to hit (e.g., /save, /history).
//  @param {string} [method="GET"] - HTTP method to use.
//  @param {object|null} [body=null] - Optional JSON payload for POST/DELETE.
//  @returns {Promise<object>} - Parsed JSON response or error object.

async function sendRequest(baseUrl, endpoint, method = "GET", body = null) {
  console.log(baseUrl);
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Server error");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error.message);
    return { error: error.message };
  }
}

//  Predefined set of backend API actions wrapped in a clean interface.
//  Uses sendRequest to communicate with the FastAPI backend.
const ReactAPI = {
  // Triggers scan via HTTP (if needed, currently unused)
  scan: () => sendRequest(config_Api.apiUrl, "/scan"),

  // Saves scan result to the backend
  saveScan: (scanData) =>
    sendRequest(config_Api.apiUrl, "/save", "POST", scanData),

  // Fetches scan history
  getHistory: () => sendRequest(config_Api.apiUrl, "/history"),

  // Deletes a scan by ID
  deleteScan: (id) =>
    sendRequest(config_Api.apiUrl, `/history/${id}`, "DELETE"),
};
//  Constructs a WebSocket URL based on the HTTP API base URL.

//  Automatically converts http:// → ws:// and https:// → wss://
//  to ensure the WebSocket protocol matches the API base.

//  @param {string} [endpoint="/scan"] - The WebSocket endpoint path.
//  @returns {string} - A complete ws:// or wss:// URL for use with WebSocket.
const getWebSocketUrl = (endpoint = "/scan") => {
  console.log(config_Api.apiUrl);
  const httpUrl = config_Api.apiUrl;
  const wsProtocol = httpUrl.startsWith("https") ? "wss" : "ws";
  const wsUrl = httpUrl.replace(/^http[s]?:/, wsProtocol + ":");
  return `${wsUrl}${endpoint}`;
};

//  Establishes a WebSocket connection to the /scan endpoint and sends scan parameters.

//  @param {string} domain - The domain to scan.
//  @param {string} source - The source for theHarvester (e.g., bing, crtsh, etc.).
//  @param {string} scan_id - UUID generated on the client to trace the scan session.
//  @param {function} onMessage - Callback to handle incoming WebSocket messages.
//  @returns {WebSocket} - The active WebSocket connection.
 function connectToScanWebSocket(domain, source, scan_id, onMessage) {
  const ws = new WebSocket(getWebSocketUrl());
  console.log(getWebSocketUrl());

  ws.onopen = () => {
    console.log("✅ WebSocket opened, sending data...", domain, source, scan_id);
    ws.send(JSON.stringify({ domain, source, scan_id }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    onMessage(msg);
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };

  return ws;
}

export { ReactAPI, connectToScanWebSocket };
