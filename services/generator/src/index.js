const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.GENERATOR_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mock generate handler
app.post('/generate', async (req, res) => {
  try {
    console.log('Generate request received:', req.body);
    
    const { projectId, runId, url, scenarios } = req.body;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return success response
    res.json({
      success: true,
      runId: runId || 'mock-run-' + Date.now(),
      message: 'Test generation started successfully',
      status: 'processing'
    });
    
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: 'Failed to start generation' });
  }
});

// Mock status handler
app.get('/status/:runId', (req, res) => {
  const { runId } = req.params;
  
  // Simulate different statuses
  const statuses = ['processing', 'completed', 'failed'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  res.json({
    runId,
    status: randomStatus,
    progress: randomStatus === 'processing' ? Math.floor(Math.random() * 100) : 100,
    message: `Test generation ${randomStatus}`
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Generator service running on port ${port}`);
});
