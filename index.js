const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let premiumTokens = {}; // temporary in-memory storage

// ✅ Simulate IPN endpoint for NOWPayments
app.post("/nowpayments-ipn", (req, res) => {
  const paymentData = req.body;
  if (paymentData.payment_status === "finished") {
    const token = generateToken();
    premiumTokens[token] = {
      orderId: paymentData.payment_id,
      createdAt: Date.now(),
    };
    console.log("✅ Premium token issued:", token);
  }
  res.status(200).send("IPN Received");
});

// ✅ Route to test without paying: manually create token
app.get("/simulate-token", (req, res) => {
  const token = generateToken();
  premiumTokens[token] = {
    orderId: "test",
    createdAt: Date.now(),
  };
  console.log("🧪 Simulated premium token:", token);
  res.json({ token });
});

// ✅ Endpoint to get latest issued token
app.get("/latest-token", (req, res) => {
  const tokens = Object.keys(premiumTokens);
  if (tokens.length === 0) return res.status(404).json({ error: "No token found" });
  const latest = tokens[tokens.length - 1];
  res.json({ token: latest });
});

// ✅ Premium AI summary via DeepSeek
app.post("/summarize", async (req, res) => {
  const { text, token } = req.body;

  if (!token || !premiumTokens[token]) {
    return res.status(401).json({ error: "Invalid or missing premium token" });
  }

  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Summarize this into bullet notes with memory tips." },
          { role: "user", content: text }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        }
      }
    );

    const summary = response.data.choices[0].message.content;
    res.json({ summary });
  } catch (err) {
    console.error("❌ DeepSeek API Error", err.message);
    res.status(500).json({ error: "Failed to generate summary." });
  }
});

function generateToken() {
  return Math.random().toString(36).substr(2, 10);
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
