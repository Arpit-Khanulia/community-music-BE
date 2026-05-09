import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import downloadRoutes from './routes/download.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: ['https://community-music-fe.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint for Railway
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Music Downloader API running' });
});

app.use('/api', downloadRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🎵 Backend running on http://localhost:${PORT}`);
});