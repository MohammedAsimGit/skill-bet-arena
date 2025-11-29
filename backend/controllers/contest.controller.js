const { getContests, getContestById, insert, update, select } = require('../utils/supabaseDb');
const Contest = require('../models/contest.model');
const Wallet = require('../models/wallet.model');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');

// Get all contests
const getAllContests = async (req, res) => {
  try {
    const { status, gameType, difficulty } = req.query;
    
    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (gameType) filters.game_type = gameType;
    if (difficulty) filters.difficulty = difficulty;
    
    const contestData = await getContests(filters);
    
    const contests = contestData.map(contest => {
      const contestModel = new Contest({
        contestId: contest.id,
        ...contest
      });
      return contestModel.toObject();
    });
    
    res.status(200).json({ contests });
  } catch (error) {
    console.error('Get contests error:', error);
    res.status(500).json({ message: 'Internal server error while fetching contests' });
  }
};

// Get contest by ID
const getContestById = async (req, res) => {
  try {
    const { contestId } = req.params;
    
    const contestData = await getContestById(contestId);
    
    if (!contestData) {
      return res.status(404).json({ message: 'Contest not found' });
    }
    
    const contest = new Contest({
      contestId: contestData.id,
      ...contestData
    });
    res.status(200).json({ contest: contest.toObject() });
  } catch (error) {
    console.error('Get contest error:', error);
    res.status(500).json({ message: 'Internal server error while fetching contest' });
  }
};

// Create new contest (admin only)
const createContest = async (req, res) => {
  try {
    // In a real implementation, you would check if user is admin
    // For now, we'll assume this is an admin route
    
    const {
      title,
      description,
      gameType,
      entryFee,
      maxPlayers,
      startTime,
      duration,
      difficulty,
      isPrivate,
      accessCode,
      questions
    } = req.body;
    
    // Validate required fields
    if (!title || !gameType || !entryFee || !maxPlayers || !startTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create contest
    const contest = new Contest({
      title,
      description,
      game_type: gameType,
      entry_fee: entryFee,
      prize_pool: 0, // Will be calculated when contest starts
      platform_commission: 0, // Will be calculated when contest starts
      max_players: maxPlayers,
      start_time: new Date(startTime),
      duration,
      created_by: req.user.uid,
      difficulty: difficulty || 'beginner',
      is_private: isPrivate || false,
      access_code: accessCode || '',
      questions: questions || []
    });
    
    const contestRecord = await insert('contests', contest.toObject());
    
    res.status(201).json({
      message: 'Contest created successfully',
      contest: contestRecord
    });
  } catch (error) {
    console.error('Create contest error:', error);
    res.status(500).json({ message: 'Internal server error while creating contest' });
  }
};

// Join contest
const joinContest = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { contestId } = req.params;
    
    // Get contest
    const contestData = await getContestById(contestId);
    
    if (!contestData) {
      return res.status(404).json({ message: 'Contest not found' });
    }
    
    const contest = new Contest({
      contestId: contestData.id,
      ...contestData
    });
    
    // Check if contest is joinable
    if (!contest.isJoinable()) {
      return res.status(400).json({ message: 'Contest is not available for joining' });
    }
    
    // Check if user is already registered
    if (contest.participants && contest.participants.includes(userId)) {
      return res.status(400).json({ message: 'You are already registered for this contest' });
    }
    
    // Get user wallet
    const walletData = await getWallet(userId);
    
    if (!walletData) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    const wallet = new Wallet(walletData);
    
    // Check if user has sufficient balance
    if (wallet.balance < contest.entryFee) {
      return res.status(400).json({ message: 'Insufficient balance to join contest' });
    }
    
    // Deduct entry fee from wallet
    wallet.deductFunds(contest.entryFee);
    await updateWallet(userId, wallet.toObject());
    
    // Create transaction
    const transaction = new Transaction({
      userId,
      type: 'contest_entry',
      amount: contest.entryFee,
      description: `Entry fee for contest ${contest.title}`,
      referenceId: contestId
    });
    
    transaction.complete();
    const transactionRecord = await insert('transactions', transaction.toObject());
    
    // Add participant to contest
    contest.addParticipant(userId);
    await update('contests', { id: contestId }, contest.toObject());
    
    res.status(200).json({
      message: 'Successfully joined contest',
      contest: contest.toObject(),
      balance: wallet.balance
    });
  } catch (error) {
    console.error('Join contest error:', error);
    res.status(500).json({ message: 'Internal server error while joining contest' });
  }
};

// Submit contest result
const submitResult = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { contestId } = req.params;
    const { score, timeTaken, answers } = req.body;
    
    // Get contest
    const contestData = await getContestById(contestId);
    
    if (!contestData) {
      return res.status(404).json({ message: 'Contest not found' });
    }
    
    const contest = new Contest({
      contestId: contestData.id,
      ...contestData
    });
    
    // Check if user is participant
    if (!contest.participants || !contest.participants.includes(userId)) {
      return res.status(403).json({ message: 'You are not registered for this contest' });
    }
    
    // Check if contest is ongoing
    if (contest.status !== 'ongoing') {
      return res.status(400).json({ message: 'Contest is not ongoing' });
    }
    
    // Save result
    const result = {
      user_id: userId,
      contest_id: contestId,
      score,
      time_taken: timeTaken,
      answers,
      submitted_at: new Date()
    };
    
    const resultRecord = await insert('results', result);
    
    // Update user stats
    const userRecords = await select('users', { id: userId }, { limit: 1 });
    if (userRecords.length > 0) {
      const userData = userRecords[0];
      const user = new User({
        uid: userData.id,
        ...userData
      });
      user.gamesPlayed++;
      user.winRate = user.calculateWinRate();
      await update('users', { id: userId }, user.toObject());
    }
    
    res.status(200).json({
      message: 'Result submitted successfully',
      result: resultRecord
    });
  } catch (error) {
    console.error('Submit result error:', error);
    res.status(500).json({ message: 'Internal server error while submitting result' });
  }
};

// Get leaderboard for contest
const getLeaderboard = async (req, res) => {
  try {
    const { contestId } = req.params;
    
    // Get contest results
    const results = await getResults(contestId, 100);
    
    res.status(200).json({ results });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Internal server error while fetching leaderboard' });
  }
};

module.exports = {
  getAllContests,
  getContestById,
  createContest,
  joinContest,
  submitResult,
  getLeaderboard
};