import api from "./api"; // This should be your axios instance

const refundService = {
  // Search for an invoice to start a refund
  getInvoice: (invoiceNo) => api.get(`/refund/invoice/${invoiceNo}`),
  
  // Submit the refund data to the backend
  processRefund: (refundData) => api.post("/refund/process", refundData),

  // Fetch all refund records for the history view
  getHistory: () => api.get("/refund/history")
};

export default refundService;