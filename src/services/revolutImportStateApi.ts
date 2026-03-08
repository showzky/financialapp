import { backendRequest } from './backendClient'
import type { StoredRevolutImportState } from '@/components/flow/revolutCsv'

export const revolutImportStateApi = {
  get(): Promise<StoredRevolutImportState> {
    return backendRequest<StoredRevolutImportState>('/revolut-import-state', { method: 'GET' })
  },

  upsert(state: StoredRevolutImportState): Promise<StoredRevolutImportState> {
    return backendRequest<StoredRevolutImportState>('/revolut-import-state', {
      method: 'PUT',
      body: JSON.stringify(state),
    })
  },

  remove(): Promise<void> {
    return backendRequest<void>('/revolut-import-state', { method: 'DELETE' })
  },
}
