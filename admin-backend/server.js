import express from 'express';
import { adminRouter } from './routes/adminRoutes.js';
import { env } from './config/env.js';

const app = express();

app.use(express.json());
app.use('/api/admin', adminRouter);

app.use((_req, res) => {
  return res.status(404).json({ success: false, message: 'Not found' });
});

app.listen(env.port, () => {
  console.log(`Admin backend running on port ${env.port}`);
});
