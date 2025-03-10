const express = require('express');
const client = require('prom-client');

const app = express();
const port = 3000;

const register = new client.Registry();

// Enable default metrics (CPU, memory, event loop lag, etc.)
client.collectDefaultMetrics({ register });

// Define a custom counter metric
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'status_code'],
});

// Register the custom metric
register.registerMetric(httpRequestsTotal);

// Middleware to count requests
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, route: req.path, status_code: res.statusCode });
  });
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('<h1>Hello, World!</h1>');
});

// Expose /metrics endpoint
app.get('/node-metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Metrics available at http://localhost:${port}/node-metrics`);
});
