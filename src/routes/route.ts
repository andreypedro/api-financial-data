import { Router } from 'express';
import { GetUsersController } from '../controllers/GetUsersController';
import { GetFinancialDocumentController } from '../controllers/GetFinancialDocumentController';
import { GetChatIdController } from '../controllers/GetChatIdController';

const route = Router();

route.get('/users', GetUsersController);
route.get('/rutine/import', GetFinancialDocumentController);
route.get('/telegram/chat-id', GetChatIdController);

export default route;
