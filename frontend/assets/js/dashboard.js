// Dashboard specific functionality
import { supabase } from './supabase.js';
import { getUserProfile, getWallet, getContests } from './database.js';

document.addEventListener('DOMContentLoaded', async () => {
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Check if user is authenticated, if not redirect to login
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            // Redirect to login page if not authenticated
            window.location.href = '../index.html';
            return;
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
        // Redirect to login page if there's an error
        window.location.href = '../index.html';
        return;
    }
    
    // Handle logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                SkillBetArena.logoutUser();
            }
        });
    }
    
    // Load user dashboard data
    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Show loading state
        showLoadingState();
        
        // Fetch user profile
        const currentUser = await supabase.auth.getUser();
        const userProfile = await getUserProfile(currentUser.data.user.id);
        
        // Fetch wallet data
        const walletData = await getWallet(currentUser.data.user.id);
        
        // Fetch user stats (using existing API for now)
        const userStats = await SkillBetArena.apiCall('/user/stats', 'GET');
        
        // Fetch active contests
        const activeContests = await getContests();
        
        // Update UI with fetched data
        updateDashboardUI(userProfile, walletData, userStats, activeContests);
        
        // Hide loading state
        hideLoadingState();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        hideLoadingState();
        showError('Failed to load dashboard data. Please try again later.');
    }
}

function showLoadingState() {
    // Add loading indicators to stat cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.innerHTML = `
            <div class="stat-icon">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="stat-info">
                <h3>Loading...</h3>
                <p>--</p>
            </div>
        `;
    });
    
    // Show loading for contests
    const contestsContainer = document.getElementById('contestsContainer');
    if (contestsContainer) {
        contestsContainer.innerHTML = '<p class="loading-text">Loading contests...</p>';
    }
}

function hideLoadingState() {
    // Remove loading indicators (will be replaced by actual data)
}

function showError(message) {
    // Display error message to user
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error';
    errorDiv.textContent = message;
    document.querySelector('.dashboard-header').after(errorDiv);
    
    // Remove error after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function updateDashboardUI(userProfile, walletData, userStats, activeContests) {
    // Update user name
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = userProfile.name || userProfile.email || 'User';
    }
    
    // Update wallet balance
    const walletBalanceElement = document.getElementById('walletBalance');
    if (walletBalanceElement) {
        walletBalanceElement.textContent = `₹${walletData.balance.toFixed(2)}`;
    }
    
    // Update games won
    const gamesWonElement = document.getElementById('gamesWon');
    if (gamesWonElement) {
        gamesWonElement.textContent = userStats.gamesWon || 0;
    }
    
    // Update win rate
    const winRateElement = document.getElementById('winRate');
    if (winRateElement) {
        const winRate = userStats.winRate ? Math.round(userStats.winRate * 100) : 0;
        winRateElement.textContent = `${winRate}%`;
    }
    
    // Update contests
    updateContestsList(activeContests);
}

function updateContestsList(contests) {
    const contestsContainer = document.getElementById('contestsContainer');
    if (!contestsContainer) return;
    
    if (contests.length === 0) {
        contestsContainer.innerHTML = '<p class="no-contests">No active contests at the moment. Check back later!</p>';
        return;
    }
    
    // Filter to only show active contests (limit to 3 for dashboard)
    const activeContests = contests.filter(contest => contest.status === 'active').slice(0, 3);
    
    if (activeContests.length === 0) {
        contestsContainer.innerHTML = '<p class="no-contests">No active contests at the moment. Check back later!</p>';
        return;
    }
    
    // Generate contest cards
    contestsContainer.innerHTML = activeContests.map(contest => `
        <div class="contest-card">
            <div class="contest-header">
                <h3>${contest.name}</h3>
                <span class="contest-badge ${getContestBadgeClass(contest.difficulty)}">${contest.difficulty}</span>
            </div>
            <div class="contest-details">
                <div class="detail-item">
                    <i class="fas fa-users"></i>
                    <span>${contest.currentPlayers}/${contest.maxPlayers} Players</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-rupee-sign"></i>
                    <span>Entry: ₹${contest.entryFee}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-gift"></i>
                    <span>Prize: ₹${contest.prizePool}</span>
                </div>
            </div>
            <div class="contest-timer">
                <i class="fas fa-clock"></i>
                <span>${formatTimeUntil(contest.startTime)}</span>
            </div>
            <button class="btn btn-primary btn-block" onclick="joinContest('${contest.id}')">Join Contest</button>
        </div>
    `).join('');
}

function getContestBadgeClass(difficulty) {
    switch (difficulty.toLowerCase()) {
        case 'beginner':
            return 'badge-success';
        case 'intermediate':
            return 'badge-warning';
        case 'expert':
            return 'badge-danger';
        default:
            return 'badge-secondary';
    }
}

function formatTimeUntil(startTime) {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = start - now;
    
    if (diffMs <= 0) {
        return 'Starting soon';
    }
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
        return `Starts in: ${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
        return `Starts in: ${diffHours}h ${diffMinutes}m`;
    } else {
        return `Starts in: ${diffMinutes} minutes`;
    }
}

// Join contest function
async function joinContest(contestId) {
    try {
        const result = await SkillBetArena.joinContest(contestId);
        alert('Successfully joined the contest!');
        // Refresh dashboard data
        await loadDashboardData();
    } catch (error) {
        console.error('Error joining contest:', error);
        alert('Failed to join contest. Please try again.');
    }
}