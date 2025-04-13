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

document.addEventListener('DOMContentLoaded', function() {
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
    
    // Initialize countdown timer
    initCountdown();

    // Initialize timeline animation
    initTimelineAnimation();
    
    // Initialize countries tooltip
    initCountriesTooltip();
    
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
    
    // Enhanced tooltip functionality
function initCountriesTooltip() {
    // Update the selector to match your current HTML structure
    const countriesCounter = document.querySelector('.counter-item:nth-child(3)');
    if (countriesCounter) {
        // Change from mouseenter/mouseleave to click
        countriesCounter.addEventListener('click', showCountriesTooltip);
        
        // Remove the mouseleave handler
        // countriesCounter.removeEventListener('mouseleave', hideCountriesTooltip);
    }
    
    // Add click handler to document to close tooltip when clicking outside
    document.addEventListener('click', function(e) {
        const tooltip = document.querySelector('.countries-tooltip');
        const countriesCounter = document.querySelector('.counter-item:nth-child(3)');
        
        // If tooltip is visible and click is outside tooltip and outside the counter
        if (tooltip && 
            tooltip.style.display === 'block' && 
            !tooltip.contains(e.target) && 
            !countriesCounter.contains(e.target)) {
            hideCountriesTooltip();
        }
    });
}

// Show countries tooltip - enhanced version
function showCountriesTooltip(e) {
    e.stopPropagation(); // Prevent document click from immediately closing it
    
    const countriesCounter = e.currentTarget;
    const countriesListJSON = countriesCounter.getAttribute('data-countries');
    
    if (!countriesListJSON) return;
    
    try {
        const countriesList = JSON.parse(countriesListJSON);
        if (countriesList.length === 0) return;
        
        const tooltip = document.querySelector('.countries-tooltip');
        if (!tooltip) return;
        
       // Generate HTML for countries list with better positioned close button
	let countriesHTML = '<div class="tooltip-close">×</div>';
	countriesHTML += '<div class="tooltip-title">Countries</div>';
	countriesHTML += '<div class="countries-list">';
	countriesList.forEach(country => {
    	countriesHTML += `<div class="country-item">${country}</div>`;
	});
	countriesHTML += '</div>';
 
        // Set tooltip content
        tooltip.innerHTML = countriesHTML;
        
        // Position tooltip at mouse position
        tooltip.style.left = e.pageX + 'px';
        tooltip.style.top = e.pageY + 'px';
        
        // Make sure tooltip doesn't go off screen
        setTimeout(() => {
            const rect = tooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            if (rect.right > viewportWidth) {
                tooltip.style.left = (viewportWidth - rect.width - 20) + 'px';
            }
            
            if (rect.bottom > viewportHeight) {
                tooltip.style.top = (viewportHeight - rect.height - 20) + 'px';
            }
        }, 0);
        
        // Show tooltip
        tooltip.style.display = 'block';
        
        // Add click handler to close button
        const closeButton = tooltip.querySelector('.tooltip-close');
        if (closeButton) {
            closeButton.addEventListener('click', function(e) {
                e.stopPropagation();
                hideCountriesTooltip();
            });
        }
    } catch (error) {
        console.error('Error showing countries tooltip:', error);
    }
}

// Hide countries tooltip
function hideCountriesTooltip() {
    const tooltip = document.querySelector('.countries-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

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
                heroes_enlisted: 23,
                spots_remaining: 77,
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
    
    // Submit application function
    function submitApplication() {
        // Validate all inputs
        const screenName = document.getElementById('screen-name').value;
        const age = document.getElementById('age').value;
        const email = document.getElementById('email').value;
        const country = document.getElementById('country').value;
        const kaspaAddress = document.getElementById('kaspa-address').value;
        const agreeTerms = document.getElementById('agree-terms').checked;
        
        // Basic validation
        if (!screenName || !age || !email || !country || !kaspaAddress) {
            alert('Please fill out all required fields!');
            return;
        }
        
        // Specifically check for terms agreement
        if (!agreeTerms) {
            alert('You must acknowledge the terms to proceed.');
            // Highlight the checkbox to draw attention
            document.getElementById('agree-terms').parentElement.classList.add('highlight-required');
            setTimeout(() => {
                document.getElementById('agree-terms').parentElement.classList.remove('highlight-required');
            }, 2000);
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address!');
            return;
        }
        
        // Get form data
        const formData = {
            screenname: screenName,
            age: age,
            country: country,
            email: email,
            'kaspa-address': kaspaAddress,
            introduction: document.getElementById('introduction').value
        };
        
        // Show loading state
        const originalBtnText = submitButton.textContent;
        submitButton.textContent = 'Submitting...';
        submitButton.disabled = true;
        
        // Submit form data to the server
        fetch('/api/submit-application', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reset button state
                submitButton.textContent = originalBtnText;
                submitButton.disabled = false;
                
                // Show success screen
                showScreen(successScreen);
                
                // Update stats with new values from the response
                if (data.stats) {
                    updateStatsDisplay(data.stats);
                } else {
                    // If no stats in the response, manually increment counters
                    const currentStats = {
                        heroes_enlisted: parseInt(heroesEnlistedEl.textContent),
                        spots_remaining: parseInt(spotsRemainingEl.textContent),
                        countries: parseInt(countriesEl.textContent),
                        tokens_per_hero: tokensPerHeroEl.textContent
                    };
                    
                    // Increment heroes and decrement spots
                    currentStats.heroes_enlisted += 1;
                    currentStats.spots_remaining -= 1;
                    
                    // Randomly increment countries (for demo purposes)
                    if (Math.random() > 0.7) {
                        currentStats.countries += 1;
                    }
                    
                    updateStatsDisplay(currentStats);
                }
                
                // Create and display thank you banner on main page
                if (!document.querySelector('.thank-you-banner')) {
                    const thankYouBanner = document.createElement('div');
                    thankYouBanner.className = 'thank-you-banner';
                    thankYouBanner.innerHTML = 'Thank you for applying to the Kaspa League of Heroes, an introduction email will be sent shortly.';
                    
                    // Insert banner after the join button
                    const ctaButtons = document.querySelector('.cta-buttons');
                    ctaButtons.parentNode.insertBefore(thankYouBanner, ctaButtons.nextSibling);
                    
                    // Disable the join button
                    joinBtn.classList.add('disabled');
                    joinBtn.style.pointerEvents = 'none';
                    joinBtn.style.opacity = '0.6';
                }
            } else {
                // Show error message
                alert(`Error: ${data.message || 'Failed to submit your application. Please try again.'}`);
                
                // Reset button state
                submitButton.textContent = originalBtnText;
                submitButton.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error submitting form:', error);
            alert('An error occurred. Please try again later.');
            
            // Reset button state
            submitButton.textContent = originalBtnText;
            submitButton.disabled = false;
            
            // For demo purposes, show success anyway
            showScreen(successScreen);
            
            // Create thank you banner (for demo)
            if (!document.querySelector('.thank-you-banner')) {
                const thankYouBanner = document.createElement('div');
                thankYouBanner.className = 'thank-you-banner';
                thankYouBanner.innerHTML = 'Thank you for applying to the Kaspa League of Heroes, an introduction email will be sent shortly.';
                
                // Insert banner after the join button
                const ctaButtons = document.querySelector('.cta-buttons');
                ctaButtons.parentNode.insertBefore(thankYouBanner, ctaButtons.nextSibling);
                
                // Disable the join button
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
        document.getElementById('age').value = '';
        document.getElementById('country').value = '';
        document.getElementById('email').value = '';
        document.getElementById('kaspa-address').value = '';
        document.getElementById('introduction').value = '';
        
        // Reset checkbox
        if (document.getElementById('agree-terms')) {
            document.getElementById('agree-terms').checked = false;
        }
        
        // Close the modal
        modal.classList.remove('active');
    });
});

/* Add animation class to timeline boxes */
document.addEventListener('DOMContentLoaded', function() {
    // Add this to handle the animation of timeline boxes
    const timelineBoxes = document.querySelectorAll('.timeline-box');
    timelineBoxes.forEach((box, index) => {
        setTimeout(() => {
            box.classList.add('active');
        }, index * 300);
    });
});

