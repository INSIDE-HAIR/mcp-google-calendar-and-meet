// OAuth Code Extractor JavaScript

class OAuthCodeExtractor {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.checkForInitialUrl();
    }

    initializeElements() {
        this.urlInput = document.getElementById('url-input');
        this.codeOutput = document.getElementById('code-output');
        this.copyBtn = document.getElementById('copy-btn');
        this.extractBtn = document.getElementById('extract-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.status = document.getElementById('status');
    }

    bindEvents() {
        this.extractBtn.addEventListener('click', () => this.extractCode());
        this.copyBtn.addEventListener('click', () => this.copyCode());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.urlInput.addEventListener('input', () => this.onUrlInputChange());
        this.urlInput.addEventListener('paste', () => {
            // Auto-extract after paste with a small delay
            setTimeout(() => this.extractCode(), 100);
        });
        
        // Allow Enter key to extract
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.extractCode();
            }
        });
    }

    checkForInitialUrl() {
        // Check if there's a URL in the address bar that we can use
        const currentUrl = window.location.href;
        if (currentUrl.includes('code=')) {
            this.urlInput.value = currentUrl;
            this.extractCode();
        }
    }

    onUrlInputChange() {
        // Clear previous results when input changes
        if (this.codeOutput.value) {
            this.codeOutput.value = '';
            this.copyBtn.disabled = true;
            this.hideStatus();
        }
    }

    extractCode() {
        const url = this.urlInput.value.trim();
        
        if (!url) {
            this.showStatus('Please enter a URL', 'error');
            return;
        }

        try {
            let code = null;
            
            // Method 1: Try parsing as URL with searchParams
            try {
                const urlObj = new URL(url);
                code = urlObj.searchParams.get('code');
            } catch (e) {
                // URL parsing failed, try manual extraction
            }
            
            // Method 2: Manual regex extraction for various formats
            if (!code) {
                // Try different patterns
                const patterns = [
                    /[?&]code=([^&\s#]+)/i,           // Standard: ?code=...
                    /\/code=([^&\s#\/]+)/i,          // Alternative: /code=...
                    /code%3D([^&\s#%]+)/i,           // URL encoded: code%3D...
                    /authorization_code=([^&\s#]+)/i  // Alternative parameter name
                ];
                
                for (const pattern of patterns) {
                    const match = url.match(pattern);
                    if (match && match[1]) {
                        code = decodeURIComponent(match[1]);
                        break;
                    }
                }
            }
            
            if (!code) {
                // Try extracting anything that looks like an OAuth code
                const oauthPattern = /4\/[0-9A-Za-z\-_]{20,}/;
                const match = url.match(oauthPattern);
                if (match) {
                    code = match[0];
                }
            }
            
            if (!code) {
                this.showStatus('No authorization code found in URL. Please check the format.', 'error');
                this.showDebugInfo(url);
                return;
            }

            // Validate that it looks like an OAuth code
            if (code.length < 10) {
                this.showStatus('The extracted code seems too short. Please verify the URL.', 'error');
                return;
            }

            // Clean up the code (remove any trailing characters)
            code = code.split(/[&#\s]/)[0];

            this.codeOutput.value = code;
            this.copyBtn.disabled = false;
            this.showStatus('Authorization code extracted successfully!', 'success');
            
            // Auto-select the code for easy copying
            this.codeOutput.select();
            
        } catch (error) {
            this.showStatus('Error extracting code. Please check the URL format.', 'error');
            console.error('Extraction error:', error);
        }
    }

    showDebugInfo(url) {
        console.log('Debug info for URL:', url);
        console.log('URL contains "code":', url.includes('code'));
        console.log('URL contains "4/":', url.includes('4/'));
        
        // Show partial matches for debugging
        const partialMatches = [
            url.match(/code[=:]/i),
            url.match(/4\/[0-9A-Za-z]/),
            url.match(/[?&][^=]*code[^=]*=/i)
        ].filter(Boolean);
        
        if (partialMatches.length > 0) {
            console.log('Partial matches found:', partialMatches);
            this.showStatus('Found partial code patterns. Check browser console for details.', 'warning');
        }
    }

    async copyCode() {
        const code = this.codeOutput.value;
        
        if (!code) {
            this.showStatus('No code to copy', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(code);
            
            // Visual feedback for successful copy
            this.copyBtn.classList.add('copy-success');
            this.showStatus('Code copied to clipboard!', 'success');
            
            // Remove the success class after animation
            setTimeout(() => {
                this.copyBtn.classList.remove('copy-success');
            }, 600);
            
        } catch (error) {
            // Fallback for browsers that don't support clipboard API
            this.fallbackCopy(code);
        }
    }

    fallbackCopy(text) {
        // Create a temporary textarea element for copying
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        
        try {
            textarea.select();
            document.execCommand('copy');
            this.showStatus('Code copied to clipboard!', 'success');
        } catch (error) {
            this.showStatus('Failed to copy code. Please copy manually.', 'error');
        } finally {
            document.body.removeChild(textarea);
        }
    }

    clearAll() {
        this.urlInput.value = '';
        this.codeOutput.value = '';
        this.copyBtn.disabled = true;
        this.hideStatus();
        this.urlInput.focus();
    }

    showStatus(message, type) {
        this.status.textContent = message;
        this.status.className = `text-sm text-center p-3 rounded-lg status-${type}`;
        this.status.classList.remove('hidden');
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => this.hideStatus(), 3000);
        }
    }

    hideStatus() {
        this.status.classList.add('hidden');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OAuthCodeExtractor();
});

// Add some utility functions for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus on URL input
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('url-input').focus();
        }
        
        // Escape to clear all
        if (e.key === 'Escape') {
            const extractor = window.oauthExtractor;
            if (extractor) {
                extractor.clearAll();
            }
        }
    });
    
    // Store reference globally for keyboard shortcuts
    window.oauthExtractor = new OAuthCodeExtractor();
});