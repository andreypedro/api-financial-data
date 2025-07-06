import express, { NextFunction, Request, Response } from 'express'
import route from './routes/route';
import { errorHandler } from './middlewares/errorHandler';
import dotenv from 'dotenv'

dotenv.config();

const server = express();

server.use(express.json())
server.use(route)
server.use(errorHandler);

export default server;