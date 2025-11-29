class Wallet {
  constructor(data) {
    this.userId = data.userId;
    this.balance = data.balance || 0;
    this.totalDeposits = data.totalDeposits || 0;
    this.totalWithdrawals = data.totalWithdrawals || 0;
    this.totalEarnings = data.totalEarnings || 0;
    this.totalSpent = data.totalSpent || 0;
    this.currency = data.currency || 'INR';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Add funds to wallet
  addFunds(amount) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    this.balance += amount;
    this.totalDeposits += amount;
    this.updatedAt = new Date();
  }

  // Deduct funds from wallet
  deductFunds(amount) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    if (this.balance < amount) {
      throw new Error('Insufficient balance');
    }
    this.balance -= amount;
    this.totalSpent += amount;
    this.updatedAt = new Date();
  }

  // Add earnings to wallet
  addEarnings(amount) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    this.balance += amount;
    this.totalEarnings += amount;
    this.updatedAt = new Date();
  }

  // Convert to plain object for database storage
  toObject() {
    return {
      userId: this.userId,
      balance: this.balance,
      totalDeposits: this.totalDeposits,
      totalWithdrawals: this.totalWithdrawals,
      totalEarnings: this.totalEarnings,
      totalSpent: this.totalSpent,
      currency: this.currency,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create wallet from database document
  static fromDocument(doc) {
    const data = doc.data();
    return new Wallet({
      userId: doc.id,
      ...data
    });
  }
}

module.exports = Wallet;