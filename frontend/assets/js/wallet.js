// Wallet page functionality
import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';
import { formatCurrency } from './profile.js';

// Function to update user profile data in the navbar
async function updateNavbarProfile() {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      return;
    }
    
    // Fetch user data from the users table
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Update navbar profile elements
    const topNavUsername = document.getElementById('topNavUsername');
    const topNavPoints = document.getElementById('topNavPoints');
    const topNavAvatar = document.getElementById('topNavAvatar');
    
    if (topNavUsername) {
      topNavUsername.textContent = userProfile.display_name || 'Player';
    }
    
    if (topNavPoints) {
      topNavPoints.textContent = `${Math.floor(userProfile.wallet_balance || 0)} pts`;
    }
    
    if (topNavAvatar && userProfile.photo_url) {
      topNavAvatar.src = userProfile.photo_url;
    }
  } catch (error) {
    console.error('Error updating navbar profile:', error);
  }
}

// Function to fetch and display wallet data
async function loadWalletData() {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      return;
    }
    
    // Fetch user wallet data
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (walletError) {
      throw new Error(walletError.message);
    }
    
    // Update wallet balance display
    const walletBalanceElement = document.getElementById('walletBalance');
    if (walletBalanceElement) {
      walletBalanceElement.textContent = formatCurrency(wallet.balance || 0);
    }
    
    // Fetch user transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (transactionsError) {
      throw new Error(transactionsError.message);
    }
    
    // Update transactions display
    const transactionHistoryElement = document.getElementById('transactionHistory');
    if (transactionHistoryElement) {
      if (transactions.length === 0) {
        transactionHistoryElement.innerHTML = '<div class="no-transactions">No transactions yet</div>';
      } else {
        transactionHistoryElement.innerHTML = transactions.map(transaction => `
          <div class="transaction-item">
            <div class="transaction-details">
              <div class="transaction-icon ${getTransactionIconClass(transaction.type)}">
                <i class="${getTransactionIcon(transaction.type)}"></i>
              </div>
              <div class="transaction-text">
                <h4>${getTransactionTitle(transaction.type, transaction.description)}</h4>
                <p class="transaction-date">${formatDate(transaction.created_at)}</p>
              </div>
              <div class="transaction-amount ${getTransactionAmountClass(transaction.amount)}">
                ${formatTransactionAmount(transaction.amount, transaction.type)}
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Error loading wallet data:', error);
    const transactionHistoryElement = document.getElementById('transactionHistory');
    if (transactionHistoryElement) {
      transactionHistoryElement.innerHTML = '<div class="error-transactions">Error loading transactions</div>';
    }
  }
}

// Helper functions for transaction display
function getTransactionIconClass(type) {
  switch (type) {
    case 'credit': return 'positive';
    case 'debit': return 'negative';
    case 'pending': return 'pending';
    default: return '';
  }
}

function getTransactionIcon(type) {
  switch (type) {
    case 'credit': return 'fas fa-arrow-down';
    case 'debit': return 'fas fa-arrow-up';
    case 'pending': return 'fas fa-clock';
    default: return 'fas fa-exchange-alt';
  }
}

function getTransactionTitle(type, description) {
  if (description) return description;
  
  switch (type) {
    case 'credit': return 'Added to wallet';
    case 'debit': return 'Debited from wallet';
    case 'pending': return 'Pending transaction';
    default: return 'Transaction';
  }
}

function getTransactionAmountClass(amount) {
  if (amount > 0) return 'positive';
  if (amount < 0) return 'negative';
  return 'pending';
}

function formatTransactionAmount(amount, type) {
  const formattedAmount = formatCurrency(Math.abs(amount));
  if (type === 'credit') return `+${formattedAmount}`;
  if (type === 'debit') return `-${formattedAmount}`;
  return formattedAmount;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  // Update navbar with real user data
  await updateNavbarProfile();
  
  // Load wallet data
  await loadWalletData();
});