import { config_Api } from "./config";

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

const ReactAPI = {
  scan: () => sendRequest(config_Api.apiUrl, "/scan"),
  saveScan: (scanData) => sendRequest(config_Api.apiUrl, "/save", "POST", scanData),
  getHistory: () => sendRequest(config_Api.apiUrl, "/history"),
  deleteScan: (id) => sendRequest(config_Api.apiUrl, `/history/${id}`, "DELETE"),
};


const getWebSocketUrl = (endpoint = "/scan") => {
  console.log(config_Api.apiUrl);
  const httpUrl = config_Api.apiUrl;
  const wsProtocol = httpUrl.startsWith("https") ? "wss" : "ws";
  const wsUrl = httpUrl.replace(/^http[s]?:/, wsProtocol + ":");
  return `${wsUrl}${endpoint}`;
};

function connectToScanWebSocket(domain, source, onMessage) {
  const ws = new WebSocket(getWebSocketUrl());
  console.log(getWebSocketUrl());

  ws.onopen = () => {
  console.log("✅ WebSocket opened, sending data...", domain, source);
  console.log(JSON.stringify({ domain, source }));
  ws.send(JSON.stringify({ domain, source }));
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
