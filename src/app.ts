import express, { NextFunction, Request, Response } from 'express'
import route from './routes/route';
import { errorHandler } from './middlewares/errorHandler';
import dotenv from 'dotenv'
import helmet from 'helmet';

dotenv.config();

const app = express();

app.use(express.json())
app.use(route)
app.use(helmet({
    contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], // Allow resources only from same origin
      scriptSrc: ["'self'"], // Only allow scripts from self, disallow inline scripts unless nonced/hashed
      objectSrc: ["'none'"], // Disallow <object>, <embed>, <applet>
    },
  },
}))
app.use(errorHandler);
app.get('/health', (_: Request, res: Response, next: NextFunction) => {
    res.status(200).send('App is running')
})

export default app;