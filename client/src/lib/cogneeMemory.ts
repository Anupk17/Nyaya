const MEMORY_API = import.meta.env.VITE_COGNEE_URL || 'http://localhost:8001'

export interface MemoryRecall {
  buyerHistory: string
  merchantHistory: string
  fraudRisk: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  buyerDisputeCount: number
  merchantComplaintCount: number
  previousVerdicts: string[]
}

const defaultRecall: MemoryRecall = {
  buyerHistory: 'Memory unavailable.',
  merchantHistory: 'Memory unavailable.',
  fraudRisk: 'NONE',
  buyerDisputeCount: 0,
  merchantComplaintCount: 0,
  previousVerdicts: []
}

export async function recallMemory(
  buyerName: string,
  merchantName: string,
  productType: string
): Promise<MemoryRecall> {
  try {
    const res = await fetch(`${MEMORY_API}/memory/recall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyer_name: buyerName,
        merchant_name: merchantName,
        product_type: productType
      }),
      signal: AbortSignal.timeout(8000)
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error)
    return {
      buyerHistory: data.buyerHistory,
      merchantHistory: data.merchantHistory,
      fraudRisk: data.fraudRisk,
      buyerDisputeCount: data.buyerDisputeCount,
      merchantComplaintCount: data.merchantComplaintCount,
      previousVerdicts: data.similarCases 
        ? [data.similarCases] : []
    }
  } catch (err) {
    console.warn('Memory recall failed, continuing:', err)
    return defaultRecall
  }
}

export async function storeMemory(dispute: any) {
  try {
    await fetch(`${MEMORY_API}/memory/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dispute_id: dispute.id,
        buyer_name: dispute.buyerName,
        seller_name: dispute.sellerName,
        product_name: dispute.productName,
        amount: dispute.amount,
        verdict: dispute.aiVerdict?.verdict || 'UNKNOWN',
        confidence: dispute.aiVerdict?.confidence || 0,
        reasoning: dispute.aiVerdict?.reasoning || '',
        status: dispute.status,
        reviewer_action: dispute.reviewerAction?.action || ''
      }),
      signal: AbortSignal.timeout(10000)
    })
    console.log(`Memory stored: ${dispute.id}`)
  } catch (err) {
    console.warn('Memory store failed:', err)
  }
}

export async function seedInitialMemory() {
  try {
    const res = await fetch(`${MEMORY_API}/memory/seed`, {
      method: 'POST',
      signal: AbortSignal.timeout(60000)
    })
    const data = await res.json()
    console.log('Cognee memory seeded:', data)
  } catch (err) {
    console.warn('Seed failed:', err)
  }
}

export async function checkMemoryHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${MEMORY_API}/health`, {
      signal: AbortSignal.timeout(3000)
    })
    const data = await res.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}
