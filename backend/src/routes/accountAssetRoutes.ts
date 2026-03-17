import { Router } from 'express'
import { searchAccountIconsController } from '../controllers/accountAssetController.js'

export const accountAssetRouter = Router()

accountAssetRouter.get('/icons/search', searchAccountIconsController)
