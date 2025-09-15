// src/api.js
export async function checkConnections(userId) {
  const WEBHOOK_URL =
    "http://localhost:5678/webhook-test/082c245f-fea2-47fb-8e85-ed50547ac741";
  const N8N_API_KEY = import.meta.env.VITE_N8N_API_KEY; // store in .env

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${N8N_API_KEY}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.errors?.join(", ") || "Connection check failed");
    }
    return data;
  } catch (err) {
    console.error("checkConnections error:", err);
    throw err;
  }
}
