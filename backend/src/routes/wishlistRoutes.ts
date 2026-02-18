import { Router } from 'express'
import { previewWishlistProduct } from '../controllers/wishlistController.js'

export const wishlistRouter = Router()

wishlistRouter.get('/preview', previewWishlistProduct)
