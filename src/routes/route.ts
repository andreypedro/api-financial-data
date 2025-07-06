
import { Router } from 'express'
import { getUsersController } from '../controllers/getUsersController'
import FinancialDocumentController from '../controllers/getFinancialDocumentController'

const route = Router()

route.get('/users', getUsersController)
route.get('/rutine/import', FinancialDocumentController)

export default route;