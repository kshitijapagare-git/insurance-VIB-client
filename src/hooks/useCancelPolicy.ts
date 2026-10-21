import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { cancelPolicy } from '../api/policies'
import type { CancelPolicyRequest, CancelPolicyResult } from '../policy/types'

export function useCancelPolicy(id: string): UseMutationResult<CancelPolicyResult, Error, CancelPolicyRequest> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CancelPolicyRequest) => cancelPolicy(id, body),
    // The dialog shows the Snackbar itself, so the hook only invalidates: the detail page's status
    // chip refetches the policy, and the expiring-soon widget refetches the list.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['policy', id] }),
        queryClient.invalidateQueries({ queryKey: ['policies'] }),
      ])
    },
  })
}
