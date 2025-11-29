class Transaction {
  constructor(data) {
    this.transactionId = data.transactionId || this.generateTransactionId();
    this.userId = data.userId;
    this.type = data.type; // deposit, withdrawal, contest_entry, contest_win, refund, bonus
    this.amount = data.amount;
    this.currency = data.currency || 'INR';
    this.status = data.status || 'pending'; // pending, completed, failed, cancelled
    this.paymentMethod = data.paymentMethod || ''; // razorpay, wallet, upi, etc.
    this.description = data.description || '';
    this.referenceId = data.referenceId || ''; // For linking to contests, orders, etc.
    this.createdAt = data.createdAt || new Date();
    this.completedAt = data.completedAt || null;
    this.metadata = data.metadata || {};
  }

  // Generate a unique transaction ID
  generateTransactionId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `TXN-${timestamp}-${randomStr}`.toUpperCase();
  }

  // Mark transaction as completed
  complete(additionalMetadata = {}) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.metadata = { ...this.metadata, ...additionalMetadata };
  }

  // Mark transaction as failed
  fail(errorReason) {
    this.status = 'failed';
    this.completedAt = new Date();
    this.metadata.error = errorReason;
  }

  // Mark transaction as cancelled
  cancel(reason) {
    this.status = 'cancelled';
    this.completedAt = new Date();
    this.metadata.cancelReason = reason;
  }

  // Convert to plain object for database storage
  toObject() {
    return {
      transactionId: this.transactionId,
      userId: this.userId,
      type: this.type,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      paymentMethod: this.paymentMethod,
      description: this.description,
      referenceId: this.referenceId,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      metadata: this.metadata
    };
  }

  // Create transaction from database document
  static fromDocument(doc) {
    const data = doc.data();
    return new Transaction({
      transactionId: doc.id,
      ...data
    });
  }
}

module.exports = Transaction;