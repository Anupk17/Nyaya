import { create } from 'zustand'
import { saveTrainingExample } from '../lib/trainingDataCollector'

export interface Dispute {
  id: string                    // PTM-XXXXX
  productName: string
  buyerName: string
  sellerName: string
  amount: number
  filedAt: Date
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 
          'ESCALATED' | 'OVERRIDDEN'
  aiVerdict: {
    verdict: string
    confidence: number
    recommendedAmount: number
    reasoning: string
    priority: string
    agentVotes: {
      evidence: string
      merchant: string
      customer: string
      judge: string
    }
  } | null
  reviewerAction: {
    action: 'APPROVED' | 'OVERRIDDEN' | null
    reason: string
    timestamp: Date | null
  }
  userMessage: string
}

interface DisputeStore {
  activePlatform: string
  disputes: Dispute[]
  setActivePlatform: (platform: string) => void
  addDispute: (dispute: Dispute) => void
  updateDisputeVerdict: (
    id: string, 
    verdict: Dispute['aiVerdict']
  ) => void
  approveDispute: (id: string) => void
  overrideDispute: (id: string, reason: string) => void
  escalateDispute: (id: string) => void
}

const SEED_DISPUTES: Dispute[] = [];

export const useDisputeStore = create<DisputeStore>((set) => ({
  activePlatform: 'paytm',
  disputes: SEED_DISPUTES,
  
  setActivePlatform: (platform) => set({ activePlatform: platform }),
  
  addDispute: (dispute) => set((state) => ({
    disputes: [dispute, ...state.disputes]
  })),
  
  updateDisputeVerdict: (id, verdict) => set((state) => ({
    disputes: state.disputes.map(d => 
      d.id === id 
        ? { 
            ...d, 
            aiVerdict: verdict,
            status: verdict?.verdict === 'ESCALATE' 
              ? 'ESCALATED' : 'PENDING'
          } 
        : d
    )
  })),
  
  approveDispute: (id) => set((state) => {
    const dispute = state.disputes.find(d => d.id === id);
    if (dispute && dispute.aiVerdict) {
      saveTrainingExample(dispute, dispute.userMessage, dispute.aiVerdict, 'APPROVED');
    }
    return {
      disputes: state.disputes.map(d =>
        d.id === id
          ? { 
              ...d, 
              status: 'APPROVED',
              reviewerAction: {
                action: 'APPROVED',
                reason: '',
                timestamp: new Date()
              }
            }
          : d
      )
    };
  }),
  
  overrideDispute: (id, reason) => set((state) => {
    const dispute = state.disputes.find(d => d.id === id);
    if (dispute && dispute.aiVerdict) {
      saveTrainingExample(dispute, dispute.userMessage, dispute.aiVerdict, 'OVERRIDDEN');
    }
    return {
      disputes: state.disputes.map(d =>
        d.id === id
          ? {
              ...d,
              status: 'OVERRIDDEN',
              reviewerAction: {
                action: 'OVERRIDDEN',
                reason,
                timestamp: new Date()
              }
            }
          : d
      )
    };
  }),
  
  escalateDispute: (id) => set((state) => ({
    disputes: state.disputes.map(d =>
      d.id === id ? { ...d, status: 'ESCALATED' } : d
    )
  })),
}));
