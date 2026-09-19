import { recallMemory, MemoryRecall } from './cogneeMemory'

export async function buildAgentContextWithMemory(
  userMessage: string
): Promise<{ context: string; memory: MemoryRecall }> {

  // Extract names from message for memory lookup
  const buyerName = extractBuyerName(userMessage)
  const merchantName = extractMerchantName(userMessage)
  const productType = extractProductType(userMessage)

  // Pull memory BEFORE building context
  const memory = await recallMemory(
    buyerName,
    merchantName, 
    productType
  )

  // Build fraud warning if needed
  let fraudWarning = ''
  if (memory.fraudRisk === 'HIGH') {
    fraudWarning = `
⚠️ HIGH FRAUD RISK: This buyer has filed ${memory.buyerDisputeCount} 
previous disputes. Treat evidence claims with extra scrutiny.
    `
  } else if (memory.fraudRisk === 'MEDIUM') {
    fraudWarning = `
⚠️ MEDIUM FRAUD RISK: This buyer has ${memory.buyerDisputeCount} 
previous disputes. Note any inconsistencies carefully.
    `
  }

  // Build precedent block from similar cases
  const precedentBlock = memory.previousVerdicts.length > 0
    ? `
=== SIMILAR PAST CASES (for reference) ===
${memory.previousVerdicts.join('\n---\n')}
==========================================
    `
    : ''

  const context = `
[CUSTOMER DISPUTE STATEMENT]
${userMessage}

[BUYER HISTORY FROM MEMORY]
${memory.buyerHistory}

[MERCHANT HISTORY FROM MEMORY]
${memory.merchantHistory}

${fraudWarning}
${precedentBlock}

(Do not quote these memory sections back to the user in your output)
  `.trim()

  return { context, memory }
}

// Helper extractors
function extractBuyerName(text: string): string {
  const patterns = [
    /my name is ([A-Z][a-z]+ [A-Z][a-z]+)/i,
    /buyer[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1]
  }
  return 'Unknown Buyer'
}

function extractMerchantName(text: string): string {
  const patterns = [
    /from ([A-Z][a-zA-Z\s]+(?:Electronics|India|Store|Hub|Bazaar|Décor|Fashion))/,
    /seller[:\s]+([A-Z][a-zA-Z\s]+)/i,
    /merchant[:\s]+([A-Z][a-zA-Z\s]+)/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1].trim()
  }
  return 'Unknown Merchant'
}

function extractProductType(text: string): string {
  const keywords = [
    'earbuds', 'headphones', 'smartwatch', 'kurta',
    'dinner set', 'cable', 'laptop', 'phone', 'tablet',
    'saree', 'shoes', 'jacket', 'electronics'
  ]
  const lower = text.toLowerCase()
  for (const kw of keywords) {
    if (lower.includes(kw)) return kw
  }
  return 'product'
}
