// Cyber Dashboard Interactivity
import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';
import { getUserProfile } from './database.js';

// Function to update user profile data in the navbar
async function updateNavbarProfile() {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      return;
    }
    
    // Fetch user profile data
    const userProfile = await getUserProfile(user.id);
    
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

document.addEventListener('DOMContentLoaded', function() {
    // Update navbar profile data
    updateNavbarProfile();
    
    // Add hover effects to game cards
    const gameCards = document.querySelectorAll('.cyber-game-card');
    gameCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add click effects to buttons
    const cyberButtons = document.querySelectorAll('.cyber-btn');
    cyberButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Add ripple effect
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add animation to leaderboard cards
    const leaderboardCards = document.querySelectorAll('.leaderboard-card, .player-card');
    leaderboardCards.forEach((card, index) => {
        // Staggered animation delay
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('slide-in');
    });
    
    // Add trophy animations
    const trophyElements = document.querySelectorAll('.trophy-gold, .trophy-silver, .trophy-bronze, .trophy');
    trophyElements.forEach((trophy, index) => {
        trophy.style.animationDelay = `${index * 0.2}s`;
        trophy.classList.add('pulse-trophy');
    });
    
    // Add hover effects to player list items
    const playerListItems = document.querySelectorAll('.player-list-item');
    playerListItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(10px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
    
    // Add click effects to leaderboard tabs
    const leaderboardTabs = document.querySelectorAll('.leaderboard-tabs .cosmic-btn.secondary');
    leaderboardTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            leaderboardTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Add visual feedback
            this.style.transform = 'translateY(-5px)';
            setTimeout(() => {
                this.style.transform = 'translateY(0)';
            }, 300);
        });
    });
    
    // Add floating animation to particles
    const particles = document.querySelectorAll('.particle');
    particles.forEach(particle => {
        // Randomize animation duration and delay
        const duration = 15 + Math.random() * 15;
        const delay = Math.random() * 5;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        
        // Add random size variation
        const size = 5 + Math.random() * 10;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
    });
    
    // Add click effect to nav items
    const navItems = document.querySelectorAll('.nav-item-cyber');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
    
    // Add pulsing effect to notification badge
    const notificationBadge = document.querySelector('.notification-badge');
    if (notificationBadge) {
        setInterval(() => {
            notificationBadge.style.transform = 'scale(1.2)';
            setTimeout(() => {
                notificationBadge.style.transform = 'scale(1)';
            }, 300);
        }, 2000);
    }
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.7);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        width: 100px;
        height: 100px;
        top: 50%;
        left: 50%;
        margin-left: -50px;
        margin-top: -50px;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .slide-in {
        animation: slideIn 0.5s ease-out forwards;
        opacity: 0;
        transform: translateY(20px);
    }
    
    @keyframes slideIn {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .pulse-trophy {
        animation: pulseTrophy 2s infinite;
    }
    
    @keyframes pulseTrophy {
        0% {
            transform: scale(1);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        }
        50% {
            transform: scale(1.1);
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
        }
        100% {
            transform: scale(1);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        }
    }
    
    .trophy-gold.pulse-trophy {
        animation: pulseGold 2s infinite;
    }
    
    .trophy-silver.pulse-trophy {
        animation: pulseSilver 2s infinite;
    }
    
    .trophy-bronze.pulse-trophy {
        animation: pulseBronze 2s infinite;
    }
    
    @keyframes pulseGold {
        0% {
            transform: scale(1);
            box-shadow: 0 0 15px #FFD700;
        }
        50% {
            transform: scale(1.1);
            box-shadow: 0 0 25px #FFD700, 0 0 35px #FFA500;
        }
        100% {
            transform: scale(1);
            box-shadow: 0 0 15px #FFD700;
        }
    }
    
    @keyframes pulseSilver {
        0% {
            transform: scale(1);
            box-shadow: 0 0 15px #C0C0C0;
        }
        50% {
            transform: scale(1.1);
            box-shadow: 0 0 25px #C0C0C0, 0 0 35px #A9A9A9;
        }
        100% {
            transform: scale(1);
            box-shadow: 0 0 15px #C0C0C0;
        }
    }
    
    @keyframes pulseBronze {
        0% {
            transform: scale(1);
            box-shadow: 0 0 15px #CD7F32;
        }
        50% {
            transform: scale(1.1);
            box-shadow: 0 0 25px #CD7F32, 0 0 35px #A0522D;
        }
        100% {
            transform: scale(1);
            box-shadow: 0 0 15px #CD7F32;
        }
    }
`;
document.head.appendChild(style);