import express, { Application, Request, Response } from 'express';
import cors from 'cors';

const app: Application = express();

// Middleware dasar
app.use(cors());
app.use(express.json());

// Endpoint Publik untuk Testing (Health Check)
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'SIKILAT V2 Backend API is running perfectly!'
  });
});

export default app;