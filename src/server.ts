import dotenv from 'dotenv';

// Load environment variables first, before any other imports that might use them
dotenv.config();

import app from './app';
import Logger from './logger/logger';
const PORT = process.env.PORT || 3000;

// start server
app.listen(PORT, () => {
  Logger.info(`SmartDrawer API started on port ${PORT}`);
});
