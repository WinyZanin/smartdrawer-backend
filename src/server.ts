import app from './app';
import dotenv from 'dotenv';
import Logger from './logger/logger';

// import config
dotenv.config();
const PORT = process.env.PORT || 3000;

// start server
app.listen(PORT, () => {
  Logger.info(`SmartDrawer API started on port ${PORT}`);
});
