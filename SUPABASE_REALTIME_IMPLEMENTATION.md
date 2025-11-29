# Supabase Real-time Implementation Guide

This guide details how to implement real-time features using Supabase Channels to replace Firebase real-time listeners in the SkillBet Arena application.

## Overview

Supabase provides real-time capabilities through PostgreSQL's LISTEN/NOTIFY mechanism combined with WebSockets. This allows you to listen for database changes and receive updates in real-time.

## Backend Implementation

### 1. Real-time Utilities

Create a utility file for real-time operations:

```javascript
// backend/utils/supabaseRealtime.js
const { supabase } = require('./supabase');

// Subscribe to database changes
function subscribeToChanges(table, event, callback) {
  try {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return channel;
  } catch (error) {
    console.error(`Failed to subscribe to ${table} changes:`, error);
    throw error;
  }
}

// Subscribe to contest updates
function subscribeToContestUpdates(callback) {
  return subscribeToChanges('contests', 'UPDATE', callback);
}

// Subscribe to new results
function subscribeToNewResults(callback) {
  return subscribeToChanges('results', 'INSERT', callback);
}

// Subscribe to leaderboard changes
function subscribeToLeaderboardChanges(contestId, callback) {
  try {
    const channel = supabase
      .channel(`leaderboard-${contestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'results',
          filter: `contest_id=eq.${contestId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'results',
          filter: `contest_id=eq.${contestId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return channel;
  } catch (error) {
    console.error(`Failed to subscribe to leaderboard changes:`, error);
    throw error;
  }
}

// Unsubscribe from channel
function unsubscribeFromChannel(channel) {
  try {
    supabase.removeChannel(channel);
  } catch (error) {
    console.error('Failed to unsubscribe from channel:', error);
  }
}

module.exports = {
  subscribeToChanges,
  subscribeToContestUpdates,
  subscribeToNewResults,
  subscribeToLeaderboardChanges,
  unsubscribeFromChannel
};
```

### 2. Real-time Controller

Create a controller to handle real-time API endpoints:

```javascript
// backend/controllers/realtime.controller.js
const { 
  subscribeToContestUpdates, 
  subscribeToNewResults, 
  subscribeToLeaderboardChanges,
  unsubscribeFromChannel
} = require('../utils/supabaseRealtime');

// Map to store active subscriptions
const activeSubscriptions = new Map();

// Subscribe to contest updates
const subscribeToContests = async (req, res) => {
  try {
    const userId = req.user.uid;
    const subscriptionId = `contests-${userId}`;
    
    // Check if already subscribed
    if (activeSubscriptions.has(subscriptionId)) {
      return res.status(200).json({ 
        message: 'Already subscribed to contest updates' 
      });
    }
    
    // Subscribe to contest updates
    const channel = subscribeToContestUpdates((payload) => {
      // Emit to user's WebSocket connection
      // This would integrate with your WebSocket implementation
      console.log('Contest updated:', payload.new);
    });
    
    // Store subscription
    activeSubscriptions.set(subscriptionId, channel);
    
    res.status(200).json({ 
      message: 'Subscribed to contest updates successfully' 
    });
  } catch (error) {
    console.error('Subscribe to contests error:', error);
    res.status(500).json({ 
      message: 'Failed to subscribe to contest updates' 
    });
  }
};

// Subscribe to leaderboard updates
const subscribeToLeaderboard = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.user.uid;
    const subscriptionId = `leaderboard-${contestId}-${userId}`;
    
    // Check if already subscribed
    if (activeSubscriptions.has(subscriptionId)) {
      return res.status(200).json({ 
        message: 'Already subscribed to leaderboard updates' 
      });
    }
    
    // Subscribe to leaderboard changes
    const channel = subscribeToLeaderboardChanges(contestId, (payload) => {
      // Emit to user's WebSocket connection
      console.log('Leaderboard updated:', payload.new);
    });
    
    // Store subscription
    activeSubscriptions.set(subscriptionId, channel);
    
    res.status(200).json({ 
      message: 'Subscribed to leaderboard updates successfully' 
    });
  } catch (error) {
    console.error('Subscribe to leaderboard error:', error);
    res.status(500).json({ 
      message: 'Failed to subscribe to leaderboard updates' 
    });
  }
};

// Unsubscribe from real-time updates
const unsubscribe = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.uid;
    const fullSubscriptionId = `${subscriptionId}-${userId}`;
    
    // Check if subscribed
    if (!activeSubscriptions.has(fullSubscriptionId)) {
      return res.status(404).json({ 
        message: 'Not subscribed to this channel' 
      });
    }
    
    // Unsubscribe
    const channel = activeSubscriptions.get(fullSubscriptionId);
    unsubscribeFromChannel(channel);
    
    // Remove from active subscriptions
    activeSubscriptions.delete(fullSubscriptionId);
    
    res.status(200).json({ 
      message: 'Unsubscribed successfully' 
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ 
      message: 'Failed to unsubscribe' 
    });
  }
};

module.exports = {
  subscribeToContests,
  subscribeToLeaderboard,
  unsubscribe
};
```

### 3. Real-time Routes

Add real-time routes to your application:

```javascript
// backend/routes/realtime.routes.js
const express = require('express');
const { 
  subscribeToContests,
  subscribeToLeaderboard,
  unsubscribe
} = require('../controllers/realtime.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Protected routes
router.post('/contests', authenticateToken, subscribeToContests);
router.post('/leaderboard/:contestId', authenticateToken, subscribeToLeaderboard);
router.delete('/:subscriptionId', authenticateToken, unsubscribe);

module.exports = router;
```

## Frontend Implementation

### 1. Real-time Client

Create a real-time client for the frontend:

```javascript
// frontend/assets/js/realtime.js
import { supabase } from './supabase.js';

// Active subscriptions
const activeSubscriptions = new Map();

// Subscribe to contest updates
function subscribeToContestUpdates(callback) {
  try {
    const channel = supabase
      .channel('contest-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contests'
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    // Store subscription
    activeSubscriptions.set('contests', channel);
    
    return channel;
  } catch (error) {
    console.error('Failed to subscribe to contest updates:', error);
    throw error;
  }
}

// Subscribe to leaderboard updates
function subscribeToLeaderboard(contestId, callback) {
  try {
    const channel = supabase
      .channel(`leaderboard-${contestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'results',
          filter: `contest_id=eq.${contestId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'results',
          filter: `contest_id=eq.${contestId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    // Store subscription
    activeSubscriptions.set(`leaderboard-${contestId}`, channel);
    
    return channel;
  } catch (error) {
    console.error('Failed to subscribe to leaderboard updates:', error);
    throw error;
  }
}

// Subscribe to live match updates
function subscribeToMatchUpdates(matchId, callback) {
  try {
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    // Store subscription
    activeSubscriptions.set(`match-${matchId}`, channel);
    
    return channel;
  } catch (error) {
    console.error('Failed to subscribe to match updates:', error);
    throw error;
  }
}

// Unsubscribe from channel
function unsubscribeFromChannel(subscriptionId) {
  try {
    if (activeSubscriptions.has(subscriptionId)) {
      const channel = activeSubscriptions.get(subscriptionId);
      supabase.removeChannel(channel);
      activeSubscriptions.delete(subscriptionId);
    }
  } catch (error) {
    console.error('Failed to unsubscribe from channel:', error);
  }
}

// Unsubscribe from all channels
function unsubscribeAll() {
  try {
    activeSubscriptions.forEach((channel, subscriptionId) => {
      supabase.removeChannel(channel);
    });
    activeSubscriptions.clear();
  } catch (error) {
    console.error('Failed to unsubscribe from all channels:', error);
  }
}

export {
  subscribeToContestUpdates,
  subscribeToLeaderboard,
  subscribeToMatchUpdates,
  unsubscribeFromChannel,
  unsubscribeAll
};
```

### 2. Real-time Dashboard Integration

Integrate real-time updates into the dashboard:

```javascript
// frontend/assets/js/dashboard.js
import { 
  subscribeToContestUpdates, 
  subscribeToLeaderboard 
} from './realtime.js';

// Initialize real-time features
async function initRealtimeFeatures() {
  try {
    // Subscribe to contest updates
    subscribeToContestUpdates((contest) => {
      // Update contest display in real-time
      updateContestDisplay(contest);
    });
    
    // Subscribe to leaderboard updates for active contests
    const activeContests = await getActiveContests();
    activeContests.forEach(contest => {
      subscribeToLeaderboard(contest.id, (result) => {
        // Update leaderboard display in real-time
        updateLeaderboardDisplay(contest.id, result);
      });
    });
  } catch (error) {
    console.error('Failed to initialize real-time features:', error);
  }
}

// Update contest display
function updateContestDisplay(contest) {
  const contestElement = document.querySelector(`[data-contest-id="${contest.id}"]`);
  if (contestElement) {
    // Update contest status, player count, etc.
    contestElement.querySelector('.contest-status').textContent = contest.status;
    contestElement.querySelector('.player-count').textContent = 
      `${contest.current_players}/${contest.max_players}`;
  }
}

// Update leaderboard display
function updateLeaderboardDisplay(contestId, result) {
  const leaderboardElement = document.querySelector(`[data-contest-id="${contestId}"] .leaderboard`);
  if (leaderboardElement) {
    // Add or update result in leaderboard
    updateLeaderboardEntry(leaderboardElement, result);
  }
}

// Call when dashboard loads
document.addEventListener('DOMContentLoaded', () => {
  // ... existing initialization code ...
  
  // Initialize real-time features
  initRealtimeFeatures();
});
```

### 3. Real-time Game Interface

Implement real-time updates in game interfaces:

```javascript
// frontend/assets/js/game.js
import { subscribeToMatchUpdates } from './realtime.js';

// Initialize real-time match updates
async function initMatchUpdates(matchId) {
  try {
    subscribeToMatchUpdates(matchId, (match) => {
      // Update match status
      updateMatchStatus(match.status);
      
      // Update player scores
      updatePlayerScores(match.scores);
      
      // Update timer
      updateMatchTimer(match.time_remaining);
      
      // Handle match completion
      if (match.status === 'completed') {
        handleMatchCompletion(match.results);
      }
    });
  } catch (error) {
    console.error('Failed to initialize match updates:', error);
  }
}

// Update match status display
function updateMatchStatus(status) {
  const statusElement = document.querySelector('.match-status');
  if (statusElement) {
    statusElement.textContent = status;
    statusElement.className = `match-status status-${status}`;
  }
}

// Update player scores in real-time
function updatePlayerScores(scores) {
  scores.forEach(playerScore => {
    const scoreElement = document.querySelector(`[data-player-id="${playerScore.player_id}"] .score`);
    if (scoreElement) {
      scoreElement.textContent = playerScore.score;
    }
  });
}

// Update match timer
function updateMatchTimer(timeRemaining) {
  const timerElement = document.querySelector('.match-timer');
  if (timerElement) {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Handle match completion
function handleMatchCompletion(results) {
  // Display results
  displayMatchResults(results);
  
  // Play completion sound
  playCompletionSound();
  
  // Show celebration animation
  showCelebrationAnimation();
}
```

## Firebase to Supabase Real-time Mapping

### 1. Firestore Document Listeners → Supabase Channels

**Firebase Firestore:**
```javascript
// Listen for contest updates
const unsubscribe = db.collection('contests')
  .doc(contestId)
  .onSnapshot((doc) => {
    const contest = doc.data();
    updateContestDisplay(contest);
  });
```

**Supabase Channels:**
```javascript
// Listen for contest updates
const channel = supabase
  .channel('contest-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'contests',
      filter: `id=eq.${contestId}`
    },
    (payload) => {
      const contest = payload.new;
      updateContestDisplay(contest);
    }
  )
  .subscribe();
```

### 2. Firestore Collection Listeners → Supabase Channels

**Firebase Firestore:**
```javascript
// Listen for new results
const unsubscribe = db.collection('results')
  .where('contestId', '==', contestId)
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const result = change.doc.data();
        addToLeaderboard(result);
      }
    });
  });
```

**Supabase Channels:**
```javascript
// Listen for new results
const channel = supabase
  .channel(`leaderboard-${contestId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'results',
      filter: `contest_id=eq.${contestId}`
    },
    (payload) => {
      const result = payload.new;
      addToLeaderboard(result);
    }
  )
  .subscribe();
```

### 3. Real-time Presence → Supabase Presence

**Firebase (custom solution needed):**
```javascript
// Firebase doesn't have built-in presence
// Custom implementation required
```

**Supabase Presence:**
```javascript
// Supabase has built-in presence tracking
const channel = supabase.channel('room')
  .on('presence', { event: 'sync' }, () => {
    const presenceState = channel.presenceState()
    console.log('Online users:', presenceState)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        online_at: new Date().toISOString(),
        user_id: userId
      })
    }
  })
```

## Performance Optimization

### 1. Channel Management

```javascript
// Efficiently manage channels
class ChannelManager {
  constructor() {
    this.channels = new Map();
  }
  
  subscribe(channelName, config, callback) {
    // Reuse existing channel if possible
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }
    
    // Create new channel
    const channel = supabase.channel(channelName);
    
    // Configure based on event type
    if (config.table && config.event) {
      channel.on('postgres_changes', config, callback);
    }
    
    // Subscribe
    channel.subscribe();
    
    // Store reference
    this.channels.set(channelName, channel);
    
    return channel;
  }
  
  unsubscribe(channelName) {
    if (this.channels.has(channelName)) {
      const channel = this.channels.get(channelName);
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }
  
  unsubscribeAll() {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

const channelManager = new ChannelManager();
```

### 2. Debouncing Updates

```javascript
// Debounce frequent updates
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Debounced leaderboard update
const debouncedLeaderboardUpdate = debounce((result) => {
  updateLeaderboardDisplay(result.contest_id, result);
}, 1000); // Update at most once per second

// Use in subscription
subscribeToLeaderboard(contestId, debouncedLeaderboardUpdate);
```

### 3. Batch Processing

```javascript
// Process updates in batches
class BatchProcessor {
  constructor(batchSize = 10, interval = 1000) {
    this.batchSize = batchSize;
    this.interval = interval;
    this.queue = [];
    this.timer = null;
  }
  
  add(item) {
    this.queue.push(item);
    
    // Process immediately if batch is full
    if (this.queue.length >= this.batchSize) {
      this.processBatch();
    } else if (!this.timer) {
      // Schedule processing
      this.timer = setTimeout(() => {
        this.processBatch();
      }, this.interval);
    }
  }
  
  processBatch() {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, this.batchSize);
    this.processItems(batch);
    
    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
  
  processItems(items) {
    // Process batch of items
    items.forEach(item => {
      updateDisplay(item);
    });
  }
}

const leaderboardProcessor = new BatchProcessor(5, 500);
```

## Error Handling

### 1. Connection Errors

```javascript
// Handle connection errors
function handleConnectionError(error) {
  console.error('Real-time connection error:', error);
  
  // Show user-friendly message
  showNotification('Connection lost. Reconnecting...', 'warning');
  
  // Attempt to reconnect
  setTimeout(() => {
    reconnectToChannels();
  }, 5000);
}

// Reconnect to channels
async function reconnectToChannels() {
  try {
    // Resubscribe to all channels
    const channelsToResubscribe = [...activeSubscriptions.entries()];
    activeSubscriptions.clear();
    
    for (const [subscriptionId, config] of channelsToResubscribe) {
      subscribeToChannel(subscriptionId, config.callback);
    }
    
    showNotification('Reconnected successfully', 'success');
  } catch (error) {
    console.error('Failed to reconnect:', error);
    showNotification('Failed to reconnect. Please refresh the page.', 'error');
  }
}
```

### 2. Subscription Errors

```javascript
// Handle subscription errors
function handleSubscriptionError(channel, error) {
  console.error('Subscription error:', error);
  
  // Unsubscribe and resubscribe
  supabase.removeChannel(channel);
  
  // Retry subscription after delay
  setTimeout(() => {
    resubscribeToChannel(channel.name);
  }, 2000);
}
```

## Testing

### 1. Unit Tests

```javascript
// Test real-time subscription
test('should subscribe to contest updates', async () => {
  const mockCallback = jest.fn();
  
  const channel = subscribeToContestUpdates(mockCallback);
  
  // Simulate database update
  await updateContestStatus('contest123', 'ongoing');
  
  // Wait for callback
  await new Promise(resolve => setTimeout(resolve, 100));
  
  expect(mockCallback).toHaveBeenCalled();
  
  // Cleanup
  unsubscribeFromChannel('contests');
});

// Test leaderboard subscription
test('should receive leaderboard updates', async () => {
  const mockCallback = jest.fn();
  const contestId = 'contest123';
  
  const channel = subscribeToLeaderboard(contestId, mockCallback);
  
  // Simulate new result
  await insertResult({
    contest_id: contestId,
    user_id: 'user123',
    score: 100
  });
  
  // Wait for callback
  await new Promise(resolve => setTimeout(resolve, 100));
  
  expect(mockCallback).toHaveBeenCalledWith(
    expect.objectContaining({
      contest_id: contestId,
      score: 100
    })
  );
  
  // Cleanup
  unsubscribeFromChannel(`leaderboard-${contestId}`);
});
```

### 2. Integration Tests

```javascript
// Test complete real-time flow
test('should handle complete real-time contest flow', async () => {
  // 1. Subscribe to contest updates
  const contestUpdates = [];
  const contestChannel = subscribeToContestUpdates((contest) => {
    contestUpdates.push(contest);
  });
  
  // 2. Subscribe to leaderboard updates
  const leaderboardUpdates = [];
  const leaderboardChannel = subscribeToLeaderboard('contest123', (result) => {
    leaderboardUpdates.push(result);
  });
  
  // 3. Trigger contest start
  await updateContestStatus('contest123', 'ongoing');
  
  // 4. Wait for updates
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 5. Verify contest update received
  expect(contestUpdates.length).toBeGreaterThan(0);
  expect(contestUpdates[0].status).toBe('ongoing');
  
  // 6. Submit result
  await insertResult({
    contest_id: 'contest123',
    user_id: 'user123',
    score: 95
  });
  
  // 7. Wait for leaderboard update
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 8. Verify leaderboard update received
  expect(leaderboardUpdates.length).toBeGreaterThan(0);
  expect(leaderboardUpdates[0].score).toBe(95);
  
  // 9. Cleanup
  unsubscribeFromChannel('contests');
  unsubscribeFromChannel('leaderboard-contest123');
});
```

## Best Practices

1. **Manage subscriptions carefully** - Unsubscribe when components unmount
2. **Handle reconnection logic** - Automatically reconnect on connection loss
3. **Debounce frequent updates** - Prevent UI thrashing with rapid updates
4. **Batch process updates** - Group multiple updates for better performance
5. **Implement error boundaries** - Gracefully handle real-time errors
6. **Use presence tracking** - Track online users for collaborative features
7. **Monitor bandwidth usage** - Be mindful of data transfer costs
8. **Test offline scenarios** - Ensure graceful degradation when offline
9. **Implement fallback mechanisms** - Provide alternatives when real-time fails
10. **Secure channels** - Use authentication and authorization for sensitive data

## Migration Strategy

### 1. Gradual Migration

1. **Phase 1**: Implement Supabase real-time alongside Firebase
2. **Phase 2**: Redirect new features to Supabase real-time
3. **Phase 3**: Migrate existing features gradually
4. **Phase 4**: Remove Firebase real-time dependencies

### 2. Feature Flags

```javascript
// Use feature flags for gradual rollout
const REALTIME_BACKEND = process.env.REALTIME_BACKEND || 'firebase'; // 'firebase' or 'supabase'

function subscribeToUpdates(config, callback) {
  if (REALTIME_BACKEND === 'supabase') {
    return subscribeToSupabaseUpdates(config, callback);
  } else {
    return subscribeToFirebaseUpdates(config, callback);
  }
}
```

## Support

For issues with Supabase real-time implementation:
- [Supabase Real-time Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Supabase Discord](https://discord.supabase.com/)