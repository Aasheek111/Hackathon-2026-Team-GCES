require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: process.env.RATELIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: process.env.RATELIMIT_MAX || 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/eyetracking', require('./routes/eyetracking'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/health', require('./routes/health'));

// Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to BrightMind API. Docs at /api-docs',
    version: '1.0.0'
  });
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
});
