import 'dotenv/config';
import { createApp } from './api/index.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

const app = createApp();
app.listen(PORT);
