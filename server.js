const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    api: 'Groq (FREE)'
  });
});

// Proxy endpoint for Groq API (FREE!)
app.post('/api/chat', async (req, res) => {
  try {
    const { apiKey, messages, stream } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // FREE model!
        messages: messages,
        stream: stream || false,
        max_tokens: 4096,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    if (stream) {
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body;
      
      reader.on('data', (chunk) => {
        res.write(chunk);
      });

      reader.on('end', () => {
        res.end();
      });

      reader.on('error', (err) => {
        console.error('Stream error:', err);
        res.end();
      });
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Using Groq API (FREE)`);
  console.log(`🎯 API endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`\n💡 Get your FREE Groq API key at: https://console.groq.com/`);
});