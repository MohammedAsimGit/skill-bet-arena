class Leaderboard {
  constructor(data) {
    this.leaderboardId = data.leaderboardId || this.generateLeaderboardId();
    this.contestId = data.contestId;
    this.gameType = data.gameType;
    this.entries = data.entries || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Generate a unique leaderboard ID
  generateLeaderboardId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `LDRB-${timestamp}-${randomStr}`.toUpperCase();
  }

  // Add entry to leaderboard
  addEntry(entry) {
    this.entries.push(entry);
    this.updatedAt = new Date();
    this.sortEntries();
  }

  // Sort entries by score (descending) and time (ascending)
  sortEntries() {
    this.entries.sort((a, b) => {
      // Sort by score descending
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort by time ascending (faster time is better)
      return a.timeTaken - b.timeTaken;
    });
  }

  // Get top N entries
  getTopEntries(limit = 10) {
    return this.entries.slice(0, limit);
  }

  // Get user rank
  getUserRank(userId) {
    const index = this.entries.findIndex(entry => entry.userId === userId);
    return index >= 0 ? index + 1 : null;
  }

  // Convert to plain object for database storage
  toObject() {
    return {
      leaderboardId: this.leaderboardId,
      contestId: this.contestId,
      gameType: this.gameType,
      entries: this.entries,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create leaderboard from database document
  static fromDocument(doc) {
    const data = doc.data();
    return new Leaderboard({
      leaderboardId: doc.id,
      ...data
    });
  }
}

module.exports = Leaderboard;