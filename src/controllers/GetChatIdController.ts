import { NextFunction, Request, Response } from 'express';
import MessageProcessorService from '../services/MessageProcessorService';

export const GetChatIdController = async (req: Request, res: Response, next: NextFunction) => {
   const messageProcessor = new MessageProcessorService();
   const chatIds = await messageProcessor.getAllChatId();

   res.json(chatIds);
};
