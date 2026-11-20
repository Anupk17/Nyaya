/**
 * Cashfree PG Adapter
 * Supports both 'mock' and 'sandbox' (real API) modes.
 * Uses headers: x-client-id, x-client-secret, x-api-version
 */

const fs = require('fs');
const path = require('path');

const CASHFREE_MODE = (process.env.CASHFREE_MODE || 'mock').toLowerCase();
const CASHFREE_BASE_URL = process.env.CASHFREE_BASE_URL || 'https://sandbox.cashfree.com/pg';
const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID || '';
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET || '';
const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || '2023-08-01';

const AUDIT_FILE = path.join(__dirname, '../data/auditLog.json');

// Helper to calculate realistic relative deadlines
function hoursFromNow(h) {
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d.toISOString();
}

/**
 * 6 Seeded Mock Disputes matching exact Cashfree Dispute & Order JSON schema
 */
let inMemoryDisputes = [
  {
    dispute_id: 'cf_disp_101',
    dispute_type: 'DISPUTE',
    dispute_status: 'ACTION_REQUIRED',
    stage: 'DISPUTE',
    reason_code: '13.1',
    reason_description: 'Merchandise Not Received: Buyer claims the package never arrived and tracking shows delayed at transit hub.',
    dispute_amount: 1499.00,
    dispute_currency: 'INR',
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    respond_by: hoursFromNow(46), // ~46 hours left (amber)
    preferred_evidence: [
      'Proof of Delivery (Signed POD / Courier OTP confirmation)',
      'Invoice / Bill of Supply',
      'Tracking & Dispatch Manifest',
      'Customer Communication Log'
    ],
    dispute_evidence: [
      {
        doc_type: 'Invoice',
        file_name: 'INV-101-Apparel.pdf',
        file_url: '/uploads/samples/INV-101.pdf',
        submitted_at: new Date(Date.now() - 30 * 3600 * 1000).toISOString()
      }
    ],
    order_details: {
      order_id: 'order_cf_9001',
      order_amount: 1499.00,
      order_currency: 'INR',
      order_date: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
      order_status: 'PAID',
      items: [
        { name: 'Men Slim Fit Denim Shirt', qty: 1, price: 1499.00, sku: 'DNM-BLU-M' }
      ],
      delivery_details: {
        courier: 'BlueDart Express',
        tracking_number: 'BLD-9988210',
        status: 'IN_TRANSIT_STUCK',
        delivered_at: null,
        otp_verified: false,
        delivery_address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru 560103'
      }
    },
    customer_details: {
      customer_id: 'cust_8801',
      customer_name: 'Rahul Sharma',
      customer_email: 'rahul.sharma@example.com',
      customer_phone: '+91 9876543210',
      customer_claim: 'I ordered the shirt 7 days ago. Tracking has been stuck at the local hub for 4 days with no updates. Courier helpline says shipment is missing. I need an immediate refund.',
      is_repeat_customer: false
    }
  },
  {
    dispute_id: 'cf_disp_102',
    dispute_type: 'CHARGEBACK',
    dispute_status: 'ACTION_REQUIRED',
    stage: 'CHARGEBACK',
    reason_code: '10.4',
    reason_description: 'Fraudulent Transaction: Cardholder denies authorizing the transaction or recognizing the merchant.',
    dispute_amount: 6450.00,
    dispute_currency: 'INR',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    respond_by: hoursFromNow(78), // ~78 hours left (green)
    preferred_evidence: [
      'Proof of Delivery with Geo-Coordinates',
      'Delivery OTP Verification Log',
      'Original Invoice / Bill of Supply',
      'Cardholder IP and Device Signature Match',
      'Account Login History'
    ],
    dispute_evidence: [
      {
        doc_type: 'Delivery Proof',
        file_name: 'POD-Signed-6450.pdf',
        file_url: '/uploads/samples/POD-Signed.pdf',
        submitted_at: new Date(Date.now() - 40 * 3600 * 1000).toISOString()
      },
      {
        doc_type: 'OTP Verification Log',
        file_name: 'OTP-Audit-9921.json',
        file_url: '/uploads/samples/OTP-Log.json',
        submitted_at: new Date(Date.now() - 40 * 3600 * 1000).toISOString()
      },
      {
        doc_type: 'Invoice',
        file_name: 'INV-102-Electronics.pdf',
        file_url: '/uploads/samples/INV-102.pdf',
        submitted_at: new Date(Date.now() - 40 * 3600 * 1000).toISOString()
      }
    ],
    order_details: {
      order_id: 'order_cf_9002',
      order_amount: 6450.00,
      order_currency: 'INR',
      order_date: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
      order_status: 'PAID',
      items: [
        { name: 'Sony WH-CH520 Wireless Headphones', qty: 1, price: 4490.00, sku: 'SNY-WH-BLK' },
        { name: 'Fast Charger 65W GaN', qty: 1, price: 1960.00, sku: 'GAN-65W' }
      ],
      delivery_details: {
        courier: 'Delhivery Express',
        tracking_number: 'DEL-44119902',
        status: 'DELIVERED',
        delivered_at: new Date(Date.now() - 8 * 86400 * 1000).toISOString(),
        otp_verified: true,
        otp_timestamp: new Date(Date.now() - 8 * 86400 * 1000 + 120000).toISOString(),
        delivery_address: 'Tower 3, Apt 11B, DLF Phase 5, Gurugram 122002'
      }
    },
    customer_details: {
      customer_id: 'cust_8802',
      customer_name: 'Vikram Malhotra',
      customer_email: 'vikram.m@example.com',
      customer_phone: '+91 9811223344',
      customer_claim: 'Unauthorized credit card debit of Rs 6,450. I was travelling abroad on this date and did not authorize this purchase.',
      is_repeat_customer: true
    }
  },
  {
    dispute_id: 'cf_disp_103',
    dispute_type: 'CHARGEBACK',
    dispute_status: 'ACTION_REQUIRED',
    stage: 'CHARGEBACK',
    reason_code: '13.3',
    reason_description: 'Item Not as Described: Buyer received an item with conflicting specifications from product listing.',
    dispute_amount: 3200.00,
    dispute_currency: 'INR',
    created_at: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
    respond_by: hoursFromNow(34), // ~34 hours left (amber)
    preferred_evidence: [
      'Product Listing Specification Sheet',
      'Packaging and Label Photographs',
      'Return / Replacement Policy Accepted by Buyer',
      'Pre-dispatch QC Inspection Certificate'
    ],
    dispute_evidence: [
      {
        doc_type: 'Customer Photo',
        file_name: 'Customer-Received-Spec-Photo.jpg',
        file_url: '/uploads/samples/Spec-Diff.jpg',
        submitted_at: new Date(Date.now() - 50 * 3600 * 1000).toISOString()
      }
    ],
    order_details: {
      order_id: 'order_cf_9003',
      order_amount: 3200.00,
      order_currency: 'INR',
      order_date: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
      order_status: 'PAID',
      items: [
        { name: 'Mechanical Gaming Keyboard (Blue Switch)', qty: 1, price: 3200.00, sku: 'KB-MEC-BLU' }
      ],
      delivery_details: {
        courier: 'Shadowfax',
        tracking_number: 'SFX-776210',
        status: 'DELIVERED',
        delivered_at: new Date(Date.now() - 11 * 86400 * 1000).toISOString(),
        otp_verified: true,
        delivery_address: 'B-12, Sector 62, Noida 201301'
      }
    },
    customer_details: {
      customer_id: 'cust_8803',
      customer_name: 'Ananya Verma',
      customer_email: 'ananya.v@example.com',
      customer_phone: '+91 9712345678',
      customer_claim: 'Listing advertised mechanical keyboard with RGB hot-swappable Blue switches. The package delivered has cheap membrane keys with single-color LED and non-removable switches.',
      is_repeat_customer: false
    }
  },
  {
    dispute_id: 'cf_disp_104',
    dispute_type: 'PRE_ARBITRATION',
    dispute_status: 'ACTION_REQUIRED',
    stage: 'PRE_ARBITRATION',
    reason_code: '10.5',
    reason_description: 'Duplicate Processing / Multiple Charge: Cardholder claims billed twice for a single order.',
    dispute_amount: 8500.00,
    dispute_currency: 'INR',
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    respond_by: hoursFromNow(28), // ~28 hours left (amber)
    preferred_evidence: [
      'Payment Gateway Settlement & Reversal Statement',
      'Bank Reference Number (RRN) Logs for both attempts',
      'Order Checkout Logs showing 1 order created',
      'Auto-refund confirmation receipt'
    ],
    dispute_evidence: [
      {
        doc_type: 'Order Confirmation',
        file_name: 'Single-Order-Log-9004.pdf',
        file_url: '/uploads/samples/Order-Log.pdf',
        submitted_at: new Date(Date.now() - 65 * 3600 * 1000).toISOString()
      },
      {
        doc_type: 'Bank RRN Logs',
        file_name: 'Bank-RRN-Reversal-Proof.pdf',
        file_url: '/uploads/samples/Bank-RRN.pdf',
        submitted_at: new Date(Date.now() - 65 * 3600 * 1000).toISOString()
      }
    ],
    order_details: {
      order_id: 'order_cf_9004',
      order_amount: 8500.00,
      order_currency: 'INR',
      order_date: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
      order_status: 'PAID',
      items: [
        { name: 'Smart Air Purifier HEPA H13', qty: 1, price: 8500.00, sku: 'AIR-PUR-H13' }
      ],
      delivery_details: {
        courier: 'DTDC Express',
        tracking_number: 'DTD-332910',
        status: 'DELIVERED',
        delivered_at: new Date(Date.now() - 12 * 86400 * 1000).toISOString(),
        otp_verified: true,
        delivery_address: 'Villa 14, Palm Meadows, Whitefield, Bengaluru 560066'
      }
    },
    customer_details: {
      customer_id: 'cust_8804',
      customer_name: 'Suresh Menon',
      customer_email: 'suresh.menon@example.com',
      customer_phone: '+91 9445566778',
      customer_claim: 'My bank statement showed two identical debits of Rs 8,500 within 2 minutes during checkout error.',
      is_repeat_customer: true
    }
  },
  {
    dispute_id: 'cf_disp_105',
    dispute_type: 'DISPUTE',
    dispute_status: 'ACTION_REQUIRED',
    stage: 'DISPUTE',
    reason_code: '13.2',
    reason_description: 'Goods Damaged in Transit: Package received crushed with internal item damaged.',
    dispute_amount: 2100.00,
    dispute_currency: 'INR',
    created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    respond_by: hoursFromNow(58), // ~58 hours left (amber)
    preferred_evidence: [
      'Outer Packaging Condition Photos',
      'Damaged Item High-Resolution Photos',
      'Courier Transit Damage Exception Report',
      'Carrier Liability / Insurance Claim ID'
    ],
    dispute_evidence: [
      {
        doc_type: 'Damage Photos',
        file_name: 'Crushed-Box-Photo.jpg',
        file_url: '/uploads/samples/Damage-Box.jpg',
        submitted_at: new Date(Date.now() - 15 * 3600 * 1000).toISOString()
      },
      {
        doc_type: 'Carrier Damage Endorsement',
        file_name: 'Courier-Damage-Report.pdf',
        file_url: '/uploads/samples/Carrier-Damage.pdf',
        submitted_at: new Date(Date.now() - 15 * 3600 * 1000).toISOString()
      }
    ],
    order_details: {
      order_id: 'order_cf_9005',
      order_amount: 2100.00,
      order_currency: 'INR',
      order_date: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
      order_status: 'PAID',
      items: [
        { name: 'Ceramic Table Lamp & Shade', qty: 1, price: 2100.00, sku: 'LMP-CRM-WHT' }
      ],
      delivery_details: {
        courier: 'Ekart Logistics',
        tracking_number: 'EKT-902188',
        status: 'DELIVERED',
        delivered_at: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
        otp_verified: true,
        delivery_address: '42, Park Street, Kolkata 700016'
      }
    },
    customer_details: {
      customer_id: 'cust_8805',
      customer_name: 'Pooja Bannerjee',
      customer_email: 'pooja.b@example.com',
      customer_phone: '+91 9830112233',
      customer_claim: 'Outer carton was completely torn and the ceramic base is cracked into pieces upon opening. Unusable.',
      is_repeat_customer: false
    }
  },
  {
    dispute_id: 'cf_disp_106',
    dispute_type: 'CHARGEBACK',
    dispute_status: 'ACTION_REQUIRED',
    stage: 'CHARGEBACK',
    reason_code: '10.4',
    reason_description: 'Fraud Claim - Stolen Card / Account Takeover (Urgent high value dispute)',
    dispute_amount: 18900.00,
    dispute_currency: 'INR',
    created_at: new Date(Date.now() - 110 * 3600 * 1000).toISOString(),
    respond_by: hoursFromNow(11), // < 24 hours left! Red countdown headline!
    preferred_evidence: [
      'Proof of Delivery with Recipient ID Check',
      'OTP Verification Logs & Timestamp',
      'Cardholder IP, Device Fingerprint & 3DS Authentication Logs',
      'Customer Purchase History on Merchant Portal'
    ],
    dispute_evidence: [
      {
        doc_type: 'Invoice',
        file_name: 'INV-106-Watch.pdf',
        file_url: '/uploads/samples/INV-106.pdf',
        submitted_at: new Date(Date.now() - 90 * 3600 * 1000).toISOString()
      },
      {
        doc_type: '3DS Auth Receipt',
        file_name: '3DS-Strong-Customer-Auth.pdf',
        file_url: '/uploads/samples/3DS-Auth.pdf',
        submitted_at: new Date(Date.now() - 80 * 3600 * 1000).toISOString()
      }
    ],
    order_details: {
      order_id: 'order_cf_9006',
      order_amount: 18900.00,
      order_currency: 'INR',
      order_date: new Date(Date.now() - 6 * 86400 * 1000).toISOString(),
      order_status: 'PAID',
      items: [
        { name: 'Garmin Forerunner 55 GPS Smartwatch', qty: 1, price: 18900.00, sku: 'GRM-FR55-BLK' }
      ],
      delivery_details: {
        courier: 'BlueDart Priority',
        tracking_number: 'BLD-7700221',
        status: 'DELIVERED',
        delivered_at: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
        otp_verified: true,
        delivery_address: 'Flat 1004, Orchid Enclave, Powai, Mumbai 400076'
      }
    },
    customer_details: {
      customer_id: 'cust_8806',
      customer_name: 'Aditya Kulkarni',
      customer_email: 'aditya.k@example.com',
      customer_phone: '+91 9820011223',
      customer_claim: 'Card stolen during transit. Multiple unauthorized transactions made, including this Rs 18,900 charge.',
      is_repeat_customer: true
    }
  }
];

// In-memory store for audit trail & idempotency
function loadAuditLog() {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      return JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not read audit log file, using empty log:', e.message);
  }
  return [];
}

function saveAuditLog(log) {
  try {
    const dir = path.dirname(AUDIT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(log, null, 2));
  } catch (e) {
    console.error('Failed to write audit log:', e);
  }
}

/**
 * Common request headers for real Cashfree calls
 */
function getHeaders(isMultipart = false) {
  const headers = {
    'x-client-id': CASHFREE_CLIENT_ID,
    'x-client-secret': CASHFREE_CLIENT_SECRET,
    'x-api-version': CASHFREE_API_VERSION
  };
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

/**
 * Cashfree Client Object
 */
const cashfreeClient = {
  getMode() {
    return CASHFREE_MODE;
  },

  /**
   * List disputes
   */
  async listDisputes(filters = {}) {
    if (CASHFREE_MODE === 'sandbox') {
      try {
        const queryParams = new URLSearchParams(filters).toString();
        const url = `${CASHFREE_BASE_URL}/disputes${queryParams ? '?' + queryParams : ''}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: getHeaders()
        });
        const data = await res.json();
        if (res.ok) {
          return Array.isArray(data) ? data : (data.disputes || [data]);
        }
      } catch (err) {
        console.warn('Sandbox listDisputes endpoint not available, serving seeded dispute queue:', err.message);
      }
      return inMemoryDisputes;
    }

    // Mock Mode
    return inMemoryDisputes;
  },

  /**
   * List disputes for a specific order
   */
  async listDisputesForOrder(orderId) {
    if (CASHFREE_MODE === 'sandbox') {
      try {
        const res = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}/disputes`, {
          method: 'GET',
          headers: getHeaders()
        });
        const data = await res.json();
        if (res.ok) {
          return Array.isArray(data) ? data : (data.disputes || []);
        }
      } catch (err) {
        console.warn('Sandbox listDisputesForOrder fallback:', err.message);
      }
      return inMemoryDisputes.filter(d => d.order_details?.order_id === orderId);
    }

    // Mock Mode
    return inMemoryDisputes.filter(d => d.order_details?.order_id === orderId);
  },

  /**
   * Get single dispute by disputeId
   */
  async getDispute(disputeId) {
    if (CASHFREE_MODE === 'sandbox') {
      try {
        const res = await fetch(`${CASHFREE_BASE_URL}/disputes/${disputeId}`, {
          method: 'GET',
          headers: getHeaders()
        });
        const data = await res.json();
        if (res.ok) {
          return data;
        }
      } catch (err) {
        console.warn(`Sandbox getDispute ${disputeId} not in gateway, serving test dossier:`, err.message);
      }
      const found = inMemoryDisputes.find(d => d.dispute_id === disputeId);
      if (found) return found;
      const err = new Error(`Dispute ${disputeId} not found in Cashfree or test dossiers`);
      err.status = 404;
      throw err;
    }

    // Mock Mode
    const found = inMemoryDisputes.find(d => d.dispute_id === disputeId);
    if (!found) {
      const err = new Error(`Dispute ${disputeId} not found`);
      err.status = 404;
      throw err;
    }
    return found;
  },

  /**
   * Submit contest evidence documents to Cashfree
   * POST /disputes/{id}/documents
   */
  async submitEvidence(disputeId, files = [], note = '') {
    if (CASHFREE_MODE === 'sandbox') {
      try {
        const formData = new FormData();
        if (files && files.length > 0) {
          const first = files[0];
          const blob = new Blob([first.buffer], { type: first.mimetype || 'application/pdf' });
          formData.append('file', blob, first.originalname || 'evidence.pdf');
          formData.append('doc_type', first.doc_type || 'Proof of Delivery');
        }
        if (note) formData.append('note', note);

        const res = await fetch(`${CASHFREE_BASE_URL}/disputes/${disputeId}/documents`, {
          method: 'POST',
          headers: getHeaders(true),
          body: formData
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || `Cashfree evidence submission failed (${res.status})`);
        }
        return data;
      } catch (err) {
        console.error('Sandbox submitEvidence error:', err);
        throw err;
      }
    }

    // Mock Mode
    const dispute = inMemoryDisputes.find(d => d.dispute_id === disputeId);
    if (!dispute) throw new Error(`Dispute ${disputeId} not found`);

    dispute.dispute_status = 'CONTESTED';
    dispute.contested_at = new Date().toISOString();
    dispute.contest_note = note;
    if (files && files.length > 0) {
      files.forEach(f => {
        dispute.dispute_evidence.push({
          doc_type: f.doc_type || 'Additional Proof',
          file_name: f.originalname || f.name || 'uploaded_doc.pdf',
          file_url: f.url || `/uploads/${disputeId}/${f.originalname || 'doc.pdf'}`,
          submitted_at: new Date().toISOString()
        });
      });
    }

    return {
      status: 'SUCCESS',
      dispute_id: disputeId,
      action: 'CONTESTED',
      message: 'Evidence documents submitted to Cashfree dispute desk.',
      dispute
    };
  },

  /**
   * Accept Dispute (concede to customer/cardholder)
   * PUT /disputes/{id}/accept
   */
  async acceptDispute(disputeId) {
    if (CASHFREE_MODE === 'sandbox') {
      try {
        const res = await fetch(`${CASHFREE_BASE_URL}/disputes/${disputeId}/accept`, {
          method: 'PUT',
          headers: getHeaders()
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || `Cashfree accept dispute failed (${res.status})`);
        }
        return data;
      } catch (err) {
        console.error('Sandbox acceptDispute error:', err);
        throw err;
      }
    }

    // Mock Mode
    const dispute = inMemoryDisputes.find(d => d.dispute_id === disputeId);
    if (!dispute) throw new Error(`Dispute ${disputeId} not found`);

    dispute.dispute_status = 'ACCEPTED';
    dispute.accepted_at = new Date().toISOString();

    return {
      status: 'SUCCESS',
      dispute_id: disputeId,
      action: 'ACCEPTED',
      message: 'Dispute accepted. Chargeback amount conceded to customer via Cashfree.',
      dispute
    };
  },

  /**
   * Create Refund
   * POST /orders/{order_id}/refunds
   */
  async createRefund(orderId, amount, refundId, note = '') {
    const rId = refundId || `ref_${Date.now()}`;
    const rAmount = parseFloat(amount);

    if (CASHFREE_MODE === 'sandbox') {
      try {
        const res = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}/refunds`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            refund_amount: rAmount,
            refund_id: rId,
            refund_note: note || 'Dispute resolution refund initiated via Nyaya',
            refund_speed: 'STANDARD'
          })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || `Cashfree refund creation failed (${res.status})`);
        }
        return data;
      } catch (err) {
        console.error('Sandbox createRefund error:', err);
        throw err;
      }
    }

    // Mock Mode
    const dispute = inMemoryDisputes.find(d => d.order_details?.order_id === orderId);
    if (dispute) {
      dispute.dispute_status = 'REFUNDED';
      dispute.refunded_at = new Date().toISOString();
      dispute.refund_details = {
        refund_id: rId,
        refund_amount: rAmount,
        refund_note: note
      };
    }

    return {
      status: 'SUCCESS',
      order_id: orderId,
      refund_id: rId,
      refund_amount: rAmount,
      refund_status: 'SUCCESS',
      created_at: new Date().toISOString(),
      message: `Refund of Rs ${rAmount} successfully initiated on Cashfree.`
    };
  },

  /**
   * Audit Trail & Idempotency Store
   */
  getAuditLog() {
    return loadAuditLog();
  },

  getAuditEntry(disputeId, action) {
    const logs = loadAuditLog();
    return logs.find(l => l.dispute_id === disputeId && l.action === action);
  },

  recordAudit(entry) {
    const logs = loadAuditLog();
    const newEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    logs.unshift(newEntry);
    saveAuditLog(logs);
    return newEntry;
  }
};

module.exports = cashfreeClient;

