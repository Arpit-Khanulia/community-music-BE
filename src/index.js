import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import downloadRoutes from './routes/download.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api', downloadRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🎵 Backend running on http://localhost:${PORT}`);
});