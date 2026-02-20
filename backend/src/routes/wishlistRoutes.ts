import { Router } from 'express'
import {
	createWishlistItem,
	deleteWishlistItem,
	listWishlistItems,
	markWishlistItemPurchased,
	previewWishlistProduct,
	restorePurchasedWishlistItem,
	updateWishlistItem,
} from '../controllers/wishlistController.js'

export const wishlistRouter = Router()

wishlistRouter.post('/', createWishlistItem)
wishlistRouter.get('/', listWishlistItems)
wishlistRouter.patch('/:id', updateWishlistItem)
wishlistRouter.patch('/:id/purchase', markWishlistItemPurchased)
wishlistRouter.patch('/:id/restore', restorePurchasedWishlistItem)
wishlistRouter.delete('/:id', deleteWishlistItem)
wishlistRouter.get('/preview', previewWishlistProduct)
