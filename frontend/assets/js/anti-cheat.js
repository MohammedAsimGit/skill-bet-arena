// Anti-Cheat System for SkillBet Arena
class AntiCheat {
    constructor() {
        this.tabSwitchCount = 0;
        this.copyPasteCount = 0;
        this.startTime = Date.now();
        this.responseTimes = [];
        this.lastResponseTime = null;
        this.suspiciousActivities = [];
        
        // Start monitoring
        this.initMonitoring();
    }
    
    // Initialize monitoring
    initMonitoring() {
        // Monitor tab switching
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.tabSwitchCount++;
                this.logSuspiciousActivity('tab_switch', { count: this.tabSwitchCount });
            }
        });
        
        // Monitor copy/paste
        document.addEventListener('copy', () => {
            this.copyPasteCount++;
            this.logSuspiciousActivity('copy_action', { count: this.copyPasteCount });
        });
        
        document.addEventListener('cut', () => {
            this.copyPasteCount++;
            this.logSuspiciousActivity('cut_action', { count: this.copyPasteCount });
        });
        
        document.addEventListener('paste', () => {
            this.copyPasteCount++;
            this.logSuspiciousActivity('paste_action', { count: this.copyPasteCount });
        });
        
        // Monitor focus loss (alt-tab, etc.)
        window.addEventListener('blur', () => {
            this.tabSwitchCount++;
            this.logSuspiciousActivity('window_blur', { count: this.tabSwitchCount });
        });
        
        // Monitor dev tools opening
        this.monitorDevTools();
    }
    
    // Monitor developer tools
    monitorDevTools() {
        let devtools = {
            open: false,
            orientation: null
        };
        
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.logSuspiciousActivity('dev_tools_opened', {});
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }
    
    // Log response time for answers
    logResponseTime(timeTaken) {
        this.responseTimes.push(timeTaken);
        
        // Check for suspiciously fast responses
        if (timeTaken < 100) { // Less than 100ms
            this.logSuspiciousActivity('impossibly_fast_response', { time: timeTaken });
        }
        
        this.lastResponseTime = Date.now();
    }
    
    // Log suspicious activity
    logSuspiciousActivity(activityType, details) {
        const activity = {
            type: activityType,
            details: details,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId()
        };
        
        this.suspiciousActivities.push(activity);
        console.warn('Suspicious activity detected:', activity);
        
        // Send to backend (in a real implementation)
        this.sendToBackend(activity);
    }
    
    // Send data to backend
    async sendToBackend(activity) {
        try {
            // In a real implementation, this would send to your backend
            // For now, we'll just log it
            console.log('Sending suspicious activity to backend:', activity);
            
            // Example API call:
            /*
            const response = await fetch('/api/anti-cheat/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(activity)
            });
            
            if (!response.ok) {
                throw new Error('Failed to report suspicious activity');
            }
            */
        } catch (error) {
            console.error('Error sending suspicious activity to backend:', error);
        }
    }
    
    // Generate session ID
    getSessionId() {
        return localStorage.getItem('sessionId') || this.generateSessionId();
    }
    
    // Generate a new session ID
    generateSessionId() {
        const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('sessionId', sessionId);
        return sessionId;
    }
    
    // Get device fingerprint
    getDeviceFingerprint() {
        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookiesEnabled: navigator.cookieEnabled,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            plugins: this.getPlugins()
        };
        
        // Create a hash of the fingerprint
        const fingerprintString = JSON.stringify(fingerprint);
        return this.simpleHash(fingerprintString);
    }
    
    // Get browser plugins
    getPlugins() {
        const plugins = [];
        for (let i = 0; i < navigator.plugins.length; i++) {
            plugins.push(navigator.plugins[i].name);
        }
        return plugins;
    }
    
    // Simple hash function
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    
    // Get session summary
    getSessionSummary() {
        return {
            tabSwitchCount: this.tabSwitchCount,
            copyPasteCount: this.copyPasteCount,
            responseTimes: this.responseTimes,
            suspiciousActivities: this.suspiciousActivities,
            totalTime: Date.now() - this.startTime,
            deviceFingerprint: this.getDeviceFingerprint()
        };
    }
    
    // Check if session is suspicious
    isSuspicious() {
        return this.tabSwitchCount > 3 || 
               this.copyPasteCount > 10 || 
               this.suspiciousActivities.length > 0;
    }
}

// Initialize anti-cheat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize for game pages
    if (window.location.pathname.includes('games') || 
        window.location.pathname.includes('coding') ||
        window.location.pathname.includes('maths') ||
        window.location.pathname.includes('memory') ||
        window.location.pathname.includes('typing')) {
        
        window.skillBetAntiCheat = new AntiCheat();
        console.log('Anti-Cheat system initialized');
    }
});

// Export for use in other modules
window.AntiCheat = AntiCheat;