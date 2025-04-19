// Enhanced Theme toggling functionality
const themeToggle = {
    init() {
        // Get the toggle button
        const toggleBtn = document.querySelector('.theme-toggle');
        if (!toggleBtn) return;
        
        // Check for saved theme preference or respect OS preference
        const savedTheme = localStorage.getItem('hero-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Set initial theme
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            this.updateToggleIcon(savedTheme);
        } else if (!prefersDark) {
            document.documentElement.setAttribute('data-theme', 'light');
            this.updateToggleIcon('light');
        } else {
            this.updateToggleIcon('dark');
        }
        
        // Add click handler to toggle theme with improved animation
        toggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // Update theme attribute
            document.documentElement.setAttribute('data-theme', newTheme);
            
            // Update toggle icon
            this.updateToggleIcon(newTheme);
            
            // Save preference
            localStorage.setItem('hero-theme', newTheme);
            
            // Add a subtle animation
            toggleBtn.classList.add('rotating');
            setTimeout(() => {
                toggleBtn.classList.remove('rotating');
            }, 500);
        });
    },
    
// Helper to update the toggle button icon
    updateToggleIcon(theme) {
        const toggleBtn = document.querySelector('.theme-toggle');
        const moonIcon = toggleBtn.querySelector('.moon-icon');
        const sunIcon = toggleBtn.querySelector('.sun-icon');
        
        if (theme === 'light') {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        } else {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        }
    }
};

// Load country list to popuplate in the join form select box
async function loadCountryList() {
  const countrySelect = document.getElementById('country');
  if (!countrySelect) return;

  try {
    const response = await fetch('https://restcountries.com/v3.1/all');
    const countries = await response.json();

    // Defensive check
    if (!Array.isArray(countries)) {
      throw new Error("REST Countries API did not return an array");
    }

    // Sort by country name (case-insensitive)
    countries.sort((a, b) =>
      a.name.common.localeCompare(b.name.common, undefined, { sensitivity: 'base' })
    );

    countrySelect.innerHTML = '<option value="">Select Country</option>';
    countries.forEach(c => {
      const name = c.name.common;
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      countrySelect.appendChild(option);
    });
  } catch (err) {
    console.error('Could not load countries:', err);
    countrySelect.innerHTML = '<option value="">Could not load countries</option>';
  }
}

// Unified tooltip system
const tooltipSystem = {
    tooltip: null,
    
    init() {
        // Create tooltip element if it doesn't exist
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'tooltip';
            this.tooltip.style.display = 'none';
            document.body.appendChild(this.tooltip);
            
            // Close tooltip when clicking outside
            document.addEventListener('click', (e) => {
                if (this.tooltip.style.display === 'block' && 
                    !this.tooltip.contains(e.target) && 
                    !e.target.closest('[data-tooltip]')) {
                    this.hide();
                }
            });
        }
        
        // Add click handlers to all tooltip triggers
        document.querySelectorAll('[data-tooltip]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.show(el, e);
            });
        });
    },
    
    show(element, event) {
        // Get tooltip content from data attributes
        const title = element.getAttribute('data-tooltip-title') || '';
        const content = element.getAttribute('data-tooltip-content') || '';
        const type = element.getAttribute('data-tooltip-type') || 'text';
        
        // Generate content based on tooltip type
        let contentHTML = '';
        
        if (type === 'countries' && element.hasAttribute('data-countries')) {
            try {
                const countriesList = JSON.parse(element.getAttribute('data-countries'));
                if (countriesList.length > 0) {
                    contentHTML = '<div class="tooltip-list">';
                    countriesList.forEach(country => {
                        contentHTML += `<div class="tooltip-item">${country}</div>`;
                    });
                    contentHTML += '</div>';
                }
            } catch (error) {
                console.error('Error parsing countries data:', error);
                contentHTML = '<div class="tooltip-content">Error loading countries data</div>';
            }
        } else {
            contentHTML = `<div class="tooltip-content">${content}</div>`;
        }
        
        // Set tooltip content with title and close button
        this.tooltip.innerHTML = `
            <div class="tooltip-close">×</div>
            <div class="tooltip-title">${title}</div>
            ${contentHTML}
        `;
        
        // Position tooltip near the element
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Initial positioning
        this.tooltip.style.left = (rect.left + scrollLeft) + 'px';
        this.tooltip.style.top = (rect.bottom + scrollTop + 10) + 'px';
        
        // Show tooltip
        this.tooltip.style.display = 'block';
        
        // Adjust position if needed to keep on screen
        setTimeout(() => {
            const tooltipRect = this.tooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Adjust horizontal position
            if (tooltipRect.right > viewportWidth) {
                this.tooltip.style.left = (viewportWidth - tooltipRect.width - 20) + 'px';
            }
            
            // Adjust vertical position if it goes below viewport
            if (tooltipRect.bottom > viewportHeight) {
                // Position above the element if it fits, otherwise position at top of viewport
                if (rect.top > tooltipRect.height + 20) {
                    this.tooltip.style.top = (rect.top + scrollTop - tooltipRect.height - 10) + 'px';
                } else {
                    this.tooltip.style.top = scrollTop + 20 + 'px';
                }
            }
        }, 0);
        
        // Add click handler to close button
        this.tooltip.querySelector('.tooltip-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.hide();
        });
    },
    
    hide() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }
};

// Info Modal System
const modalSystem = {
    modals: {},
    
    init() {
        // Create each modal based on data attributes
        document.querySelectorAll('[data-modal-trigger]').forEach(trigger => {
            const modalId = trigger.getAttribute('data-modal-trigger');
            const modalTitle = trigger.getAttribute('data-modal-title') || '';
            const modalContent = document.getElementById(modalId + '-content');
            
            if (!modalContent) {
                console.error(`Modal content element #${modalId}-content not found`);
                return;
            }
            
            // Create modal if it doesn't exist
            if (!this.modals[modalId]) {
                // Create modal container
                const modal = document.createElement('div');
                modal.id = modalId;
                modal.className = 'info-modal';
                
                // Create modal content
                modal.innerHTML = `
                    <div class="info-modal-content">
                        <button class="info-modal-close">&times;</button>
                        <div class="info-modal-title">${modalTitle}</div>
                        <div class="info-modal-body"></div>
                    </div>
                `;
                
                // Clone the content
                const contentClone = modalContent.cloneNode(true);
                contentClone.style.display = 'block';
                
                // Add the content to the modal
                modal.querySelector('.info-modal-body').appendChild(contentClone);
                
                // Add modal to DOM
                document.body.appendChild(modal);
                
                // Store modal reference
                this.modals[modalId] = modal;
                
                // Close button event
                modal.querySelector('.info-modal-close').addEventListener('click', () => {
                    this.hide(modalId);
                });
                
                // Click outside to close
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.hide(modalId);
                    }
                });
            }
            
            // Add click event to trigger
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                this.show(modalId);
            });
        });
    },
    
    show(modalId) {
        if (this.modals[modalId]) {
            this.modals[modalId].classList.add('active');
            // Prevent body scrolling
            document.body.style.overflow = 'hidden';
        }
    },
    
    hide(modalId) {
        if (this.modals[modalId]) {
            this.modals[modalId].classList.remove('active');
            // Restore body scrolling
            document.body.style.overflow = '';
        }
    }
};

// Animate timeline boxes when they come into view
function initTimelineAnimation() {
    const timelineBoxes = document.querySelectorAll('.timeline-box');
    
    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add a slight delay between each item for a staggered effect
                    const index = Array.from(timelineBoxes).indexOf(entry.target);
                    setTimeout(() => {
                        entry.target.classList.add('active');
                    }, index * 300);
                    
                    // Unobserve after animation
                    timelineObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.3
        });
        
        // Initially none are active
        timelineBoxes.forEach(item => {
            item.classList.remove('active');
            timelineObserver.observe(item);
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        // Just make the first one active
        if (timelineBoxes.length > 0) {
            timelineBoxes[0].classList.add('active');
        }
    }
}


// ***************************** Main ****************************
document.addEventListener('DOMContentLoaded', function() {
    // Start populating the countries
    loadCountryList();
    

    // related to Light/Dark toggle
    const style = document.createElement('style');
    style.textContent = `
        .theme-toggle.rotating {
            transform: rotate(360deg);
            transition: transform 0.5s ease;
        }
        
        /* Ensure transitions are smooth for theme changes */
        body, .modal-content, .info-modal-content, .grid-item, .form-section, input, select, textarea, button {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    // Initialize theme toggle
    themeToggle.init();

    // Modal elements
    const joinBtn = document.getElementById('join-league-btn');
    const modal = document.getElementById('hero-modal');
    const closeModal = document.getElementById('close-modal');
    
    // Form screens
    const initialScreen = document.getElementById('initial-screen');
    const unifiedForm = document.getElementById('unified-form');
    const successScreen = document.getElementById('success-screen');
    
    // Navigation buttons
    const startApplication = document.getElementById('start-application');
    const backToIntroBtn = document.getElementById('back-to-intro');
    const submitButton = document.getElementById('submit-application');
    const closeSuccessButton = document.getElementById('close-success');
    
    // Stats elements
    const heroesEnlistedEl = document.getElementById('heroes-enlisted');
    const spotsRemainingEl = document.getElementById('spots-remaining');
    const countriesEl = document.getElementById('countries');
    const tokensPerHeroEl = document.getElementById('tokens-per-hero');
    
    // Initialize the tooltip system
    tooltipSystem.init();
    
    // Initialize the modal system
    modalSystem.init();
    
    // Initialize countdown timer
    initCountdown();
    
    // Initialize timeline animation
    initTimelineAnimation();
    
    // Fetch initial stats
    fetchStats();
    
    // Function to initialize countdown timer
    function initCountdown() {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }
    
    // Function to update countdown
    function updateCountdown() {
        const targetDate = new Date('June 20, 2025 23:59:59').getTime();
        const now = new Date().getTime();
        const timeLeft = targetDate - now;
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        document.getElementById('countdown-days').textContent = days.toString().padStart(2, '0');
        document.getElementById('countdown-hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('countdown-minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('countdown-seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    // Setup tooltip triggers for stats
    function setupTooltipTriggers() {
        // Spots Remaining tooltip
        const spotsCounter = document.querySelector('.counter-item:nth-child(2)');
        if (spotsCounter) {
            spotsCounter.setAttribute('data-tooltip', 'true');
            spotsCounter.setAttribute('data-tooltip-title', 'Spots Remaining');
            spotsCounter.setAttribute('data-tooltip-type', 'text');
            spotsCounter.setAttribute('data-tooltip-content', 'If we receive less than 100 applications, then every member will get 1B $HERO. If we get more than 100 applications, then the 100 members will be selected by a fair and transparent raffle.');
        }
        
        // Countries tooltip
        const countriesCounter = document.querySelector('.counter-item:nth-child(3)');
        if (countriesCounter) {
            countriesCounter.setAttribute('data-tooltip', 'true');
            countriesCounter.setAttribute('data-tooltip-title', 'Countries');
            countriesCounter.setAttribute('data-tooltip-type', 'countries');
        }
        
        // Tokens Per Hero tooltip
        const tokensCounter = document.querySelector('.counter-item:nth-child(4)');
        if (tokensCounter) {
            tokensCounter.setAttribute('data-tooltip', 'true');
            tokensCounter.setAttribute('data-tooltip-title', 'Tokens Per Hero');
            tokensCounter.setAttribute('data-tooltip-type', 'text');
            tokensCounter.setAttribute('data-tooltip-content', 'Each member will receive 1B out of 100B Total Supply.');
        }
    }
    
    // Call setupTooltipTriggers after DOM is loaded
    setupTooltipTriggers();

    // Update countries list data attribute
    function updateCountriesList(countriesList) {
        const countriesCounter = document.querySelector('.counter-item:nth-child(3)');
        if (countriesCounter) {
            countriesCounter.setAttribute('data-countries', JSON.stringify(countriesList));
        }
    }
    
    // Function to fetch and update stats
    function fetchStats() {
        // For demo purposes, use placeholder stats if API is not available
        const demoStats = {
            success: true,
            stats: {
                heroes_enlisted: 3,
                spots_remaining: 97,
                countries: 12,
                tokens_per_hero: '1B'
            }
        };
        
        // Fetch stats
        fetch('/api/stats')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.stats) {
                    updateStatsDisplay(data.stats);
                }
            })
            .catch(error => {
                console.error('Error fetching stats:', error);
                // Use demo stats if API fails
                updateStatsDisplay(demoStats.stats);
            });
        
        // Fetch countries list separately
        fetch('/api/countries')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.countries) {
                    updateCountriesList(data.countries);
                }
            })
            .catch(error => {
                console.error('Error fetching countries:', error);
                // Use demo countries if API fails
                updateCountriesList(['United States', 'Canada', 'United Kingdom', 'Germany', 'Australia', 'Japan', 'Brazil', 'India', 'Nigeria', 'France', 'Sweden', 'Netherlands']);
            });
    }    
    
    // Function to update stats display
    function updateStatsDisplay(stats) {
        // Apply animation by adding and removing a class
        [heroesEnlistedEl, spotsRemainingEl, countriesEl, tokensPerHeroEl].forEach(el => {
            if (el) {
                el.classList.add('updating');
                setTimeout(() => el.classList.remove('updating'), 1000);
            }
        });
        
        // Update values with animation
        if (heroesEnlistedEl) heroesEnlistedEl.textContent = stats.heroes_enlisted;
        if (spotsRemainingEl) spotsRemainingEl.textContent = stats.spots_remaining;
        if (countriesEl) countriesEl.textContent = stats.countries;
        if (tokensPerHeroEl) tokensPerHeroEl.textContent = stats.tokens_per_hero;
    }
    
    // Helper function to show a specific screen
    function showScreen(screen) {
        // Hide all screens
        initialScreen.classList.remove('active');
        unifiedForm.classList.remove('active');
        successScreen.classList.remove('active');
        
        // Show the requested screen
        screen.classList.add('active');
        
        // Reset scroll position whenever screen changes
        if (document.querySelector('.modal-content')) {
            document.querySelector('.modal-content').scrollTop = 0;
        }
    }
    
    // Open modal when join button is clicked
    joinBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // First make sure scroll position is restored
        const scrollPosition = window.scrollY;
        
        modal.classList.add('active');
        showScreen(initialScreen);
        
        // Maintain page scroll position
        setTimeout(function() {
            window.scrollTo(0, scrollPosition);
        }, 10);
    });
    
    // Close modal when close button is clicked
    closeModal.addEventListener('click', function() {
        modal.classList.remove('active');
    });
    
    // Close modal when clicking outside the content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Start application
    startApplication.addEventListener('click', function() {
        showScreen(unifiedForm);
        // Ensure any autofocus doesn't cause jumping
        setTimeout(function() {
            if (document.activeElement) {
                document.activeElement.blur();
            }
        }, 10);
    });
    
    // Go back to intro screen
    backToIntroBtn.addEventListener('click', function() {
        showScreen(initialScreen);
    });
    
    // Prevent space key from scrolling the page when clicking the checkbox
    if (document.getElementById('agree-terms')) {
        document.getElementById('agree-terms').addEventListener('keydown', function(e) {
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
            }
        });
    }
    
    // Add this to your submitApplication function
    function submitApplication() {
        // Get form values
        const screenName = document.getElementById('screen-name').value;
        const birthdateValue = document.getElementById('birthdate').value;
        const email = document.getElementById('email').value;
        const country = document.getElementById('country').value;
        const kaspaAddress = document.getElementById('kaspa-address').value;
        const socialMedia = document.getElementById('social-media').value;
        const agreeTerms = document.getElementById('agree-terms').checked;
        
        // Basic validation
        const requiredFields = [
            { id: 'screen-name', name: 'Screen Name' },
            { id: 'birthdate', name: 'Birth Date' },
            { id: 'email', name: 'Email' },
            { id: 'country', name: 'Country' },
            { id: 'kaspa-address', name: 'Kaspa Wallet Address' },
            { id: 'social-media', name: 'Social Media' }
        ];
        
        let emptyFields = [];
        let hasErrors = false;
        
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            const value = element.value.trim();
            
            if (!value) {
                emptyFields.push(field.name);
                element.classList.add('error-field');
                setTimeout(() => {
                    element.classList.remove('error-field');
                }, 3000);
                hasErrors = true;
            }
        });
        
        if (emptyFields.length > 0) {
            alert(`Please fill out all required fields: ${emptyFields.join(', ')}`);
            return;
        }
        
        // For the HTML5 date input
        let birthdate, age;
        
        if (document.getElementById('birthdate').type === 'date') {
            // HTML5 date input
            birthdate = new Date(birthdateValue);
            
            const today = new Date();
            age = today.getFullYear() - birthdate.getFullYear();
            const monthDiff = today.getMonth() - birthdate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
                age--;
            }
        } else {
            // Text input with MM/DD/YYYY format
            const parts = birthdateValue.split('/');
            if (parts.length !== 3) {
                alert('Please enter a valid birth date in MM/DD/YYYY format');
                document.getElementById('birthdate').classList.add('error-field');
                setTimeout(() => {
                    document.getElementById('birthdate').classList.remove('error-field');
                }, 3000);
                return;
            }
            
            const month = parseInt(parts[0]) - 1; // JS months are 0-indexed
            const day = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            
            birthdate = new Date(year, month, day);
            
            // Check if date is valid
            if (isNaN(birthdate.getTime())) {
                alert('Please enter a valid birth date');
                document.getElementById('birthdate').classList.add('error-field');
                setTimeout(() => {
                    document.getElementById('birthdate').classList.remove('error-field');
                }, 3000);
                return;
            }
            
            // Calculate age
            const today = new Date();
            age = today.getFullYear() - birthdate.getFullYear();
            const monthDiff = today.getMonth() - birthdate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
                age--;
            }
        }
        
        // Validate minimum age (18)
        if (age < 18) {
            alert('You must be at least 18 years old to apply');
            document.getElementById('birthdate').classList.add('error-field');
            setTimeout(() => {
                document.getElementById('birthdate').classList.remove('error-field');
            }, 3000);
            return;
        }
        
        // Check terms agreement
        if (!agreeTerms) {
            alert('You must acknowledge the terms to proceed');
            document.getElementById('agree-terms').parentElement.classList.add('highlight-required');
            setTimeout(() => {
                document.getElementById('agree-terms').parentElement.classList.remove('highlight-required');
            }, 2000);
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            document.getElementById('email').classList.add('error-field');
            setTimeout(() => {
                document.getElementById('email').classList.remove('error-field');
            }, 3000);
            return;
        }
        
        // Prepare form data - only send the calculated age to the server
        const formData = {
            screenname: screenName,
            age: age, // Send calculated age based on birth date
            email: email,
            country: country,
            kaspaAddress: kaspaAddress,
            socialMedia: socialMedia,
            introduction: document.getElementById('introduction').value
        };
        
        // Show loading state
        const originalBtnText = submitButton.textContent;
        submitButton.textContent = 'Submitting...';
        submitButton.disabled = true;
        
        // Submit form data to the server - this uses your existing endpoint
        fetch('/api/submit-application', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            // Your existing success handling code
            if (data.success) {
                submitButton.textContent = originalBtnText;
                submitButton.disabled = false;
                showScreen(successScreen);
                
                if (data.stats) {
                    updateStatsDisplay(data.stats);
                } else {
                    const currentStats = {
                        heroes_enlisted: parseInt(heroesEnlistedEl.textContent),
                        spots_remaining: parseInt(spotsRemainingEl.textContent),
                        countries: parseInt(countriesEl.textContent),
                        tokens_per_hero: tokensPerHeroEl.textContent
                    };
                    
                    currentStats.heroes_enlisted += 1;
                    currentStats.spots_remaining -= 1;
                    
                    if (Math.random() > 0.7) {
                        currentStats.countries += 1;
                    }
                    
                    updateStatsDisplay(currentStats);
                }
                
                if (!document.querySelector('.thank-you-banner')) {
                    const thankYouBanner = document.createElement('div');
                    thankYouBanner.className = 'thank-you-banner';
                    thankYouBanner.innerHTML = 'Thank you for applying to the Kaspa League of Heroes, an introduction email will be sent shortly.';
                    
                    const ctaButtons = document.querySelector('.cta-buttons');
                    ctaButtons.parentNode.insertBefore(thankYouBanner, ctaButtons.nextSibling);
                    
                    joinBtn.classList.add('disabled');
                    joinBtn.style.pointerEvents = 'none';
                    joinBtn.style.opacity = '0.6';
                }
            } else {
                alert(`Error: ${data.message || 'Failed to submit your application. Please try again.'}`);
                submitButton.textContent = originalBtnText;
                submitButton.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error submitting form:', error);
            alert('An error occurred. Please try again later.');
            
            submitButton.textContent = originalBtnText;
            submitButton.disabled = false;
            
            // Demo fallback
            showScreen(successScreen);
            
            if (!document.querySelector('.thank-you-banner')) {
                const thankYouBanner = document.createElement('div');
                thankYouBanner.className = 'thank-you-banner';
                thankYouBanner.innerHTML = 'Thank you for applying to the Kaspa League of Heroes, an introduction email will be sent shortly.';
                
                const ctaButtons = document.querySelector('.cta-buttons');
                ctaButtons.parentNode.insertBefore(thankYouBanner, ctaButtons.nextSibling);
                
                joinBtn.classList.add('disabled');
                joinBtn.style.pointerEvents = 'none';
                joinBtn.style.opacity = '0.6';
            }
        });
    }   

    // Submit with intro
    submitButton.addEventListener('click', function() {
        submitApplication();
    });
    
    // Close success screen
    closeSuccessButton.addEventListener('click', function() {
        // Clear all form fields for a fresh start
        document.getElementById('screen-name').value = '';
        //document.getElementById('bithdate').value = '';
        document.getElementById('country').value = '';
        document.getElementById('email').value = '';
        document.getElementById('kaspa-address').value = '';
        document.getElementById('social-media').value = '';
        document.getElementById('introduction').value = '';
        
        // Reset checkbox
        if (document.getElementById('agree-terms')) {
            document.getElementById('agree-terms').checked = false;
        }
        
        // Close the modal
        modal.classList.remove('active');
    });

    /* Add animation class to timeline boxes */
    const timelineBoxes = document.querySelectorAll('.timeline-box');
    timelineBoxes.forEach((box, index) => {
        setTimeout(() => {
            box.classList.add('active');
        }, index * 300);
    });
});
