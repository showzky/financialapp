// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { wishlistApi, type WishlistItem } from '@financial-app/shared'

export default function App() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await wishlistApi.list()
        setItems(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load wishlist'
        setError(message)
        console.error('Error loading wishlist:', err)
      } finally {
        setLoading(false)
      }
    }

    void loadWishlist()
  }, [])

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Loading wishlist...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Wishlist ({items.length})</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemPrice}>
              {item.price ? `NOK ${item.price}` : 'No price'}
            </Text>
            <Text style={styles.itemMeta}>{item.category || 'Uncategorized'}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.text}>No items in your wishlist yet</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingBottom: 16,
    color: '#333',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6c7df0',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: '#999',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
  },
})
