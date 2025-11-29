class User {
  constructor(data) {
    this.uid = data.uid;
    this.email = data.email;
    this.displayName = data.displayName || '';
    this.phoneNumber = data.phoneNumber || '';
    this.photoURL = data.photoURL || '';
    this.createdAt = data.createdAt || new Date();
    this.lastLoginAt = data.lastLoginAt || new Date();
    this.isEmailVerified = data.isEmailVerified || false;
    this.disabled = data.disabled || false;
    this.walletBalance = data.walletBalance || 0;
    this.totalEarnings = data.totalEarnings || 0;
    this.gamesPlayed = data.gamesPlayed || 0;
    this.gamesWon = data.gamesWon || 0;
    this.winRate = data.winRate || 0;
    this.referralCode = data.referralCode || '';
    this.referredBy = data.referredBy || '';
    this.subscriptionType = data.subscriptionType || 'free'; // free, gold, elite
    this.subscriptionExpiry = data.subscriptionExpiry || null;
    this.deviceFingerprint = data.deviceFingerprint || '';
    this.isBanned = data.isBanned || false;
  }

  // Calculate win rate percentage
  calculateWinRate() {
    if (this.gamesPlayed === 0) return 0;
    return Math.round((this.gamesWon / this.gamesPlayed) * 100);
  }

  // Check if user has active subscription
  hasActiveSubscription() {
    if (!this.subscriptionExpiry) return false;
    return new Date(this.subscriptionExpiry) > new Date();
  }

  // Check if user is eligible for elite features
  isEliteMember() {
    return this.subscriptionType === 'elite' && this.hasActiveSubscription();
  }

  // Check if user is eligible for gold features
  isGoldMember() {
    return (this.subscriptionType === 'gold' || this.subscriptionType === 'elite') && this.hasActiveSubscription();
  }

  // Convert to plain object for database storage
  toObject() {
    return {
      uid: this.uid,
      email: this.email,
      displayName: this.displayName,
      phoneNumber: this.phoneNumber,
      photoURL: this.photoURL,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
      isEmailVerified: this.isEmailVerified,
      disabled: this.disabled,
      walletBalance: this.walletBalance,
      totalEarnings: this.totalEarnings,
      gamesPlayed: this.gamesPlayed,
      gamesWon: this.gamesWon,
      winRate: this.winRate,
      referralCode: this.referralCode,
      referredBy: this.referredBy,
      subscriptionType: this.subscriptionType,
      subscriptionExpiry: this.subscriptionExpiry,
      deviceFingerprint: this.deviceFingerprint,
      isBanned: this.isBanned
    };
  }

  // Create user from database document
  static fromDocument(doc) {
    const data = doc.data();
    return new User({
      uid: doc.id,
      ...data
    });
  }
}

module.exports = User;