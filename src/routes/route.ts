
import { Router } from 'express'
import { GetUsersController } from '../controllers/GetUsersController'
import { GetFinancialDocumentController } from '../controllers/GetFinancialDocumentController'
import { SampleController } from '../controllers/SampleController'
import { OnFleetAuthenticationController } from '../controllers/OnFleetAuthenticationController'
import { ChallengeController } from '../controllers/ChallangeController'

const route = Router()

route.get('/users', GetUsersController)
route.get('/rutine/import', GetFinancialDocumentController)
route.get('/sample', SampleController)
route.get('/onfleet-authentication', OnFleetAuthenticationController)
route.get('/challenge', ChallengeController)

export default route;