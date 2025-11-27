import 'dotenv/config';
import { validateEnvironment } from './config/env.js';
import { createApp } from './api/index.js';

// Validate environment variables on startup
validateEnvironment();

const PORT = parseInt(process.env.PORT || '3000', 10);

const app = createApp();
app.listen(PORT);
