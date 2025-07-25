require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/summarize", async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "No content provided" });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an AI that converts content into bullet-pointed study notes and memory tricks.",
          },
          {
            role: "user",
            content: \`Summarize this into bullet study notes and memory tricks:\n\${content}\`,
          },
        ],
      },
      {
        headers: {
          Authorization: \`Bearer \${process.env.OPENROUTER_API_KEY}\`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://your-frontend-site.netlify.app",
          "X-Title": "PDF AI Study Tool",
        },
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    res.json({ summary: aiResponse });
  } catch (error) {
    console.error("OpenRouter API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to summarize content" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
