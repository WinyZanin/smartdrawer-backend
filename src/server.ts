import app from './app';
import dotenv from 'dotenv';

// import config
dotenv.config();
const PORT = process.env.PORT || 3000;

// start server
app.listen(PORT, () => {
  console.log(`🚀 SmartDrawer API rodando na porta ${PORT}`);
});
