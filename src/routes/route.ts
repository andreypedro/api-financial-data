import { Router } from 'express';
import { GetUsersController } from '../controllers/GetUsersController';
import { GetFinancialDocumentController } from '../controllers/GetFinancialDocumentController';
import { GetChatIdController } from '../controllers/GetChatIdController';
import { GetFinancialMarketDataController } from '../controllers/GetFinancialMarketDataController';
import { TestAIController } from '../controllers/TestAIController';

const route = Router();

route.get('/users', GetUsersController);
route.get('/rutine/import-market-documents', GetFinancialDocumentController);
route.get('/rutine/import-market-data', GetFinancialMarketDataController);
route.get('/telegram/get-users', GetChatIdController);
route.get('/ai/test', TestAIController);

export default route;
