import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import "../styles/pos.css";
import { Plus, Minus, ReceiptText, Search, Printer, User, RotateCcw, History } from "lucide-react";
import beepSound from "/beep.mp3";
import InvoiceModal from "../components/InvoiceModal";
import RefundModal from "../components/RefundModal";
import RefundHistoryModal from "../components/RefundHistoryModal";

function Pos({ user }) {
  const [query, setQuery] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentType, setPaymentType] = useState("CASH");
  const [vatPercent, setVatPercent] = useState(0); 
  const [discountPercent, setDiscountPercent] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [scanSuccess, setScanSuccess] = useState(false);
  const beepRef = useRef(new Audio(beepSound));
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [printType, setPrintType] = useState("thermal");

  // Refund Modals State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // 1. LIVE SEARCH
  useEffect(() => {
    if (!query.trim()) {
      setMedicines([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const res = await api.get(`/medicines/search?q=${encodeURIComponent(query)}`);
        setMedicines(Array.isArray(res.data.data) ? res.data.data : []);
      } catch {
        setMedicines([]);
      }
    }, 200);
    return () => clearTimeout(delay);
  }, [query]);

  // 2. BARCODE/ENTER HANDLER
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && medicines.length === 1) {
        handleScanSuccess(medicines[0]);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [medicines]);

  function handleScanSuccess(med) {
    beepRef.current.currentTime = 0;
    beepRef.current.play().catch(() => {});
    setScanSuccess(true);
    setTimeout(() => setScanSuccess(false), 600);
    addToCart(med);
  }

  function addToCart(med) {
    const batch = med.batches?.find((b) => b.quantity > 0);
    if (!batch) {
      setError(`Stock empty for ${med.name}`);
      setTimeout(() => setError(""), 3000);
      return;
    }
    setCart((prev) => {
      const exist = prev.find((i) => i.medicineId === med.id);
      if (exist) {
        if (exist.qty >= batch.quantity) {
          setError("Stock limit reached");
          return prev;
        }
        return prev.map((i) => i.medicineId === med.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        medicineId: med.id,
        name: med.name,
        price: Number(batch.sellPrice),
        qty: 1,
        batchId: batch.id
      }];
    });
    setQuery("");
    searchInputRef.current?.focus();
  }

  function changeQty(id, delta) {
    setCart((prev) => prev.map((i) => i.medicineId === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0));
  }

  // 3. PROFESSIONAL CALCULATIONS
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountAmount = (subtotal * Number(discountPercent || 0)) / 100;
  const taxableAmount = subtotal - discountAmount;
  const vatAmount = (taxableAmount * Number(vatPercent || 0)) / 100;
  const grandTotal = taxableAmount + vatAmount;

  // 4. CREATE INVOICE
  async function createInvoice() {
    if (!cart.length) return;
    setLoading(true);
    setError("");

    try {
      const payload = {
        customerName: customerName || "Walk-in Customer",
        paymentType: paymentType,
        subtotal: subtotal,
        total: grandTotal,
        discount: Number(discountPercent), 
        vat: Number(vatPercent), 
        staffId: user?.id,
        items: cart.map((i) => ({
          medicineId: i.medicineId,
          batchId: i.batchId,
          quantity: i.qty,
          sellPrice: i.price
        })),
      };

      const res = await api.post("/billing/create", payload);

      setInvoiceData({
        id: res.data.data.id,
        invoiceNo: res.data.data.invoiceNo,
        createdAt: res.data.data.createdAt,
        customerName: customerName || "Walk-in Customer",
        paymentType: paymentType,
        subtotal: subtotal,
        discountPercent: discountPercent,
        discountAmount: discountAmount,
        vatPercent: vatPercent,
        vatAmount: vatAmount,
        grandTotal: grandTotal,
        items: cart.map((i) => ({
          invoiceItemId: i.invoiceItemId || i.id, 
          name: i.name,
          quantity: i.qty,
          price: i.price,
          total: i.price * i.qty
        })),
        cashier: user?.name
      });

      setShowInvoice(true);

      setCart([]);
      setQuery("");
      setCustomerName("");
      setVatPercent(0);
      setDiscountPercent(0);
      setPaymentType("CASH");
      searchInputRef.current?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Billing failed. Check stock.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pos-container">
      <RefundModal 
        isOpen={isRefundModalOpen} 
        onClose={() => setIsRefundModalOpen(false)} 
      />

      <RefundHistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
      />

      <div className="pos-left">
        <div className="pos-title-area">
          <div className="pos-brand-header">
            <h2 className="pos-system-title">BILLING SYSTEM</h2>
          </div>
          
          <div className="pos-action-buttons">
            <button 
              className="history-trigger-btn"
              onClick={() => setIsHistoryModalOpen(true)}
            >
              <History size={16} /> Return History
            </button>

            <button 
              className="refund-trigger-btn"
              onClick={() => setIsRefundModalOpen(true)}
            >
              <RotateCcw size={16} /> Return Item
            </button>
          </div>
        </div>

        {scanSuccess && <div className="scan-success">✔ Item Added</div>}

        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            ref={searchInputRef}
            className="pos-input-search"
            placeholder="Scan Barcode or Type Medicine Name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="pos-search-results">
          {medicines.map((m) => (
            <div key={m.id} className="pos-item" onClick={() => handleScanSuccess(m)}>
              <div className="pos-item-info">
                <span className="name">{m.name}</span>
                <span className="stock">In Stock: {m.batches?.reduce((a,b)=>a+b.quantity,0) || 0}</span>
              </div>
              <strong className="price">BDT {m.batches?.[0]?.sellPrice ?? "0.00"}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="pos-right">
        <div className="invoice-box">
          <div className="invoice-header">
            <ReceiptText size={18} />
            <span>Billing Details</span>
          </div>

          <div className="customer-section">
            <input
              placeholder="Customer Name / Phone"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
               <option value="CASH">Cash Payment</option>
               <option value="BKASH">bKash</option>
               <option value="CARD">Card Payment</option>
            </select>
          </div>

          <div className="cart-header">
            <span className="col-name">Medicine</span>
            <span className="col-qty">Qty</span>
            <span className="col-total">Total</span>
          </div>

          <div className="cart-scroll-area">
            {cart.length === 0 && <div className="empty-cart-msg">No items in cart</div>}
            {cart.map((i) => (
              <div key={i.medicineId} className="cart-row">
                <div className="item-meta">
                  <span className="item-name">{i.name}</span>
                  {/* Using '/' is more clinical than '@' */}
                  <small className="unit-p">৳ {i.price.toFixed(2)} / unit</small> 
                </div>
                
                <div className="qty-controls">
                  <button onClick={() => changeQty(i.medicineId, -1)} aria-label="Decrease">
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="qty-val">{i.qty}</span>
                  <button onClick={() => changeQty(i.medicineId, 1)} aria-label="Increase">
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
                
                <span className="row-total">{ (i.price * i.qty).toFixed(2) }</span>
              </div>
            ))}
          </div>

          <div className="summary-section" >
            {/* Header for the section */}
            <div className="summary-header">Payment Reconcile</div>

            <div className="sum-line">
              <span className="label">Gross Subtotal</span>
              <span className="val tabular">৳ {subtotal.toFixed(2)}</span>
            </div>

            <div className="sum-line input-row highlight-red">
              <div className="label-group">
                <label>Discount (%)</label>
                <input
                  type="number"
                  className="clinical-input"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <span className="minus-val tabular">− ৳ {discountAmount.toFixed(2)}</span>
            </div>

            <div className="sum-line input-row">
              <div className="label-group">
                <label>Govt VAT (%)</label>
                <input
                  type="number"
                  className="clinical-input"
                  value={vatPercent}
                  onChange={(e) => setVatPercent(e.target.value)}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <span className="plus-val tabular">+ ৳ {vatAmount.toFixed(2)}</span>
            </div>

            <div className="grand-total-display">
              <div className="total-content">
                <span className="total-label">Total Payable Amount</span>
                <span className="total-val tabular">৳ {grandTotal.toFixed(2)}</span>
              </div>
              <div className="total-accent-bar"></div>
            </div>
          </div>

          {error && <div className="error-toast">{error}</div>}

          <button
            className="checkout-primary-btn"
            disabled={loading || cart.length === 0}
            onClick={createInvoice}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div> {/* Optional: Add a CSS spinner here */}
                SECURELY PROCESSING...
              </>
            ) : (
              <>
                <Printer size={20} strokeWidth={2.5} />
                <span>Confirm & Print Receipt</span>
              </>
            )}
          </button>
          <p style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', marginTop: '8px' }}>
            PRESS <strong>F8</strong> FOR QUICK CHECKOUT
          </p>
        </div>
      </div>

      <InvoiceModal
        open={showInvoice}
        onClose={() => setShowInvoice(false)}
        invoice={invoiceData}
        staffId={user?.id}
        printType={printType}
        setPrintType={setPrintType}
      />
    </div>
  );
}

export default Pos;