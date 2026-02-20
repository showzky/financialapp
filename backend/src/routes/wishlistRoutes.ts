import { Router } from 'express'
import {
	createWishlistItem,
	deleteWishlistItem,
	listWishlistItems,
	previewWishlistProduct,
	updateWishlistItem,
} from '../controllers/wishlistController.js'

export const wishlistRouter = Router()

wishlistRouter.post('/', createWishlistItem)
wishlistRouter.get('/', listWishlistItems)
wishlistRouter.patch('/:id', updateWishlistItem)
wishlistRouter.delete('/:id', deleteWishlistItem)
wishlistRouter.get('/preview', previewWishlistProduct)
