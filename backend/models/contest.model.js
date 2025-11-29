class Contest {
  constructor(data) {
    this.contestId = data.contestId || this.generateContestId();
    this.title = data.title;
    this.description = data.description || '';
    this.gameType = data.gameType; // coding, maths, memory, typing
    this.entryFee = data.entryFee;
    this.prizePool = data.prizePool;
    this.platformCommission = data.platformCommission || 0;
    this.maxPlayers = data.maxPlayers;
    this.currentPlayers = data.currentPlayers || 0;
    this.status = data.status || 'upcoming'; // upcoming, ongoing, completed, cancelled
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.duration = data.duration || 0; // in minutes
    this.createdBy = data.createdBy || 'system'; // admin user ID or 'system'
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.participants = data.participants || []; // array of user IDs
    this.winners = data.winners || []; // array of {userId, rank, prize}
    this.questions = data.questions || []; // for games like coding and maths
    this.difficulty = data.difficulty || 'beginner'; // beginner, intermediate, expert
    this.isPrivate = data.isPrivate || false;
    this.accessCode = data.accessCode || '';
  }

  // Generate a unique contest ID
  generateContestId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `CTST-${timestamp}-${randomStr}`.toUpperCase();
  }

  // Add participant to contest
  addParticipant(userId) {
    if (this.currentPlayers >= this.maxPlayers) {
      throw new Error('Contest is full');
    }
    
    if (this.participants.includes(userId)) {
      throw new Error('User already registered for this contest');
    }
    
    this.participants.push(userId);
    this.currentPlayers++;
    this.updatedAt = new Date();
    
    // Auto-start if contest is full
    if (this.currentPlayers === this.maxPlayers) {
      this.status = 'ongoing';
      this.startTime = new Date();
    }
  }

  // Remove participant from contest
  removeParticipant(userId) {
    const index = this.participants.indexOf(userId);
    if (index > -1) {
      this.participants.splice(index, 1);
      this.currentPlayers--;
      this.updatedAt = new Date();
    }
  }

  // Start contest
  start() {
    if (this.status !== 'upcoming') {
      throw new Error('Contest cannot be started');
    }
    
    this.status = 'ongoing';
    this.startTime = new Date();
    this.updatedAt = new Date();
  }

  // End contest
  end(winners) {
    if (this.status !== 'ongoing') {
      throw new Error('Contest is not ongoing');
    }
    
    this.status = 'completed';
    this.endTime = new Date();
    this.winners = winners;
    this.updatedAt = new Date();
  }

  // Cancel contest
  cancel() {
    this.status = 'cancelled';
    this.endTime = new Date();
    this.updatedAt = new Date();
  }

  // Check if contest is joinable
  isJoinable() {
    return this.status === 'upcoming' && 
           this.currentPlayers < this.maxPlayers && 
           new Date() < new Date(this.startTime);
  }

  // Calculate platform commission
  calculateCommission(platformCommissionPercentage) {
    this.platformCommission = (this.entryFee * this.currentPlayers * platformCommissionPercentage) / 100;
    this.prizePool = (this.entryFee * this.currentPlayers) - this.platformCommission;
    return {
      platformCommission: this.platformCommission,
      prizePool: this.prizePool
    };
  }

  // Convert to plain object for database storage
  toObject() {
    return {
      contestId: this.contestId,
      title: this.title,
      description: this.description,
      gameType: this.gameType,
      entryFee: this.entryFee,
      prizePool: this.prizePool,
      platformCommission: this.platformCommission,
      maxPlayers: this.maxPlayers,
      currentPlayers: this.currentPlayers,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      participants: this.participants,
      winners: this.winners,
      questions: this.questions,
      difficulty: this.difficulty,
      isPrivate: this.isPrivate,
      accessCode: this.accessCode
    };
  }

  // Create contest from database document
  static fromDocument(doc) {
    const data = doc.data();
    return new Contest({
      contestId: doc.id,
      ...data
    });
  }
}

module.exports = Contest;