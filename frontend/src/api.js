export const scan = (domain) =>
  fetch("http://localhost:4000/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),  // שימו לב: domain עם d קטן
  }).then(response => {
    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }
    return response.json();
  });
