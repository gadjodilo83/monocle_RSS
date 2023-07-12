const fetchGpt = async () => {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: transcript.text },
  ];

  const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: temperature,
      max_tokens: 2000,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const message = await response.text();
    console.error("API request error:", response.status, message);
    throw new Error(`API request failed: ${message}`);
  }

  const resJson = await response.json();
  const res = resJson?.choices?.[0]?.text;
  if (!res) return;
  setDisplayedResponse(res);
  await displayRawRizz(res);
};
