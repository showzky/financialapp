const response = await fetch(
  'https://production-sfo.browserless.io/scrape?token=2U6ohJV5HMhoOpJ0f9dffdcfb42bccab1ada8649aec92ab5a',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://example.com',
      elements: [{ selector: 'h1' }]
    })
  }
);
const data = await response.json();
console.log(data);