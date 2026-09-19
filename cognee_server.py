from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import cognee
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_cognee():
    cognee.config.set_llm_provider("groq")
    cognee.config.set_llm_model("llama-3.3-70b-versatile")
    cognee.config.set_llm_api_key(os.getenv("GROQ_API_KEY"))
    
    # Fix: explicitly set embeddings to use
    # a local model so it never calls OpenAI
    cognee.config.set_embedding_provider("fastembed")
    cognee.config.set_embedding_model("BAAI/bge-small-en-v1.5")
    
    cognee.config.set_vector_db_provider("lancedb")

class StoreRequest(BaseModel):
    dispute_id: str
    buyer_name: str
    seller_name: str
    product_name: str
    amount: float
    verdict: str
    confidence: int
    reasoning: str
    status: str
    reviewer_action: Optional[str] = ""

class RecallRequest(BaseModel):
    buyer_name: str
    merchant_name: str
    product_type: str

@app.get("/health")
async def health():
    return {"status": "ok", "service": "Nyaya Memory Server"}

@app.post("/memory/store")
async def store_memory(req: StoreRequest):
    try:
        init_cognee()
        memory_text = f"""
NYAYA DISPUTE RECORD
ID: {req.dispute_id}
Buyer Name: {req.buyer_name}
Merchant Name: {req.seller_name}
Product: {req.product_name}
Claimed Amount: {req.amount} rupees
AI Verdict: {req.verdict}
AI Confidence: {req.confidence} percent
AI Reasoning: {req.reasoning}
Final Status: {req.status}
Reviewer Decision: {req.reviewer_action}
        """.strip()

        await cognee.add(
            memory_text, 
            dataset_name="nyaya_disputes"
        )
        await cognee.cognify(datasets=["nyaya_disputes"])
        return {"success": True, "stored": req.dispute_id}

    except Exception as e:
        print(f"Store error: {e}")
        return {"success": False, "error": str(e)}

@app.post("/memory/recall")
async def recall_memory(req: RecallRequest):
    try:
        init_cognee()

        buyer_results = await cognee.search(
            f"disputes filed by buyer named {req.buyer_name}",
            query_type="insights"
        )
        merchant_results = await cognee.search(
            f"complaints against merchant {req.merchant_name}",
            query_type="insights"
        )
        similar_results = await cognee.search(
            f"past verdicts for {req.product_type} disputes",
            query_type="insights"
        )

        buyer_count = len(buyer_results) if buyer_results else 0
        merchant_count = len(merchant_results) \
                         if merchant_results else 0

        fraud_risk = "NONE"
        if buyer_count >= 5:
            fraud_risk = "HIGH"
        elif buyer_count >= 3:
            fraud_risk = "MEDIUM"
        elif buyer_count >= 1:
            fraud_risk = "LOW"

        def format_results(results, empty_msg):
            if not results or len(results) == 0:
                return empty_msg
            return "\n---\n".join([
                str(r.get("text", r)) 
                for r in results[:3]
            ])

        return {
            "success": True,
            "buyerHistory": format_results(
                buyer_results,
                "No previous disputes found for this buyer."
            ),
            "merchantHistory": format_results(
                merchant_results,
                "No previous complaints against this merchant."
            ),
            "similarCases": format_results(
                similar_results,
                "No similar past cases found."
            ),
            "fraudRisk": fraud_risk,
            "buyerDisputeCount": buyer_count,
            "merchantComplaintCount": merchant_count
        }

    except Exception as e:
        print(f"Recall error: {e}")
        return {
            "success": False,
            "buyerHistory": "Memory search unavailable.",
            "merchantHistory": "Memory search unavailable.",
            "similarCases": "",
            "fraudRisk": "NONE",
            "buyerDisputeCount": 0,
            "merchantComplaintCount": 0,
            "error": str(e)
        }

@app.post("/memory/seed")
async def seed_memory():
    seed_cases = [
        StoreRequest(
            dispute_id="PTM-88213",
            buyer_name="Rahul Sharma",
            seller_name="QuickMart Electronics",
            product_name="boAt Airdopes 141",
            amount=2499,
            verdict="FULL_REFUND",
            confidence=89,
            reasoning="No OTP confirmation. Damage photo within 6hrs. Invoice present. Clear non-delivery case.",
            status="APPROVED",
            reviewer_action="APPROVED"
        ),
        StoreRequest(
            dispute_id="PTM-88214",
            buyer_name="Priya Patel",
            seller_name="FashionHub India",
            product_name="Designer Kurta Set Maroon XL",
            amount=3499,
            verdict="DENY",
            confidence=91,
            reasoning="OTP confirmed delivery. Buyer remorse. No damage evidence. Filed 6 days later.",
            status="OVERRIDDEN",
            reviewer_action="OVERRIDDEN"
        ),
        StoreRequest(
            dispute_id="PTM-88215",
            buyer_name="Amit Verma",
            seller_name="TechBazaar",
            product_name="Noise Smartwatch Pro X200",
            amount=4999,
            verdict="ESCALATE",
            confidence=43,
            reasoning="Serial number mismatch. Possible counterfeit. Poor photo quality. Invoice missing.",
            status="ESCALATED",
            reviewer_action="NONE"
        ),
        StoreRequest(
            dispute_id="PTM-88216",
            buyer_name="Sneha Reddy",
            seller_name="HomeStyle Decor",
            product_name="Ceramic Dinner Set 12 pieces",
            amount=2150,
            verdict="PARTIAL_REFUND",
            confidence=74,
            reasoning="3 of 12 pieces damaged. OTP confirmed but damage photo within 1 hour is valid.",
            status="APPROVED",
            reviewer_action="APPROVED"
        ),
        StoreRequest(
            dispute_id="PTM-88217",
            buyer_name="Rahul Sharma",
            seller_name="TechBazaar",
            product_name="USB C Charging Cable",
            amount=899,
            verdict="FULL_REFUND",
            confidence=82,
            reasoning="Second dispute by same buyer. No OTP. Cable not delivered. Pattern noted.",
            status="APPROVED",
            reviewer_action="APPROVED"
        )
    ]

    results = []
    for case in seed_cases:
        result = await store_memory(case)
        results.append({
            "id": case.dispute_id,
            "success": result.get("success")
        })
        await asyncio.sleep(1)

    return {
        "message": "Seed complete",
        "total": len(results),
        "results": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "cognee_server:app", 
        host="0.0.0.0", 
        port=8001, 
        reload=True
    )
