
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

	
	// start populating the countries
	loadCountryList();
	
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
    
    // Initialize tooltips (replaces initCountriesTooltip)
    initTooltips();
    
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
    
    function initTooltips() {
        // Spots Remaining tooltip
        const spotsCounter = document.querySelector('.counter-item:nth-child(2)');
        if (spotsCounter) {
            spotsCounter.setAttribute('data-tooltip-title', 'Spots Remaining');
            spotsCounter.setAttribute('data-tooltip-type', 'spots');
            spotsCounter.setAttribute('data-tooltip-content', 'If we receive less than 100 applications, then every member will get 1B $HERO. If we get more than 100 applications, then the 100 members will be selected by a fair and transparent raffle.');
            spotsCounter.addEventListener('click', showTooltip);
        }
        
        // Countries tooltip
        const countriesCounter = document.querySelector('.counter-item:nth-child(3)');
        if (countriesCounter) {
            countriesCounter.setAttribute('data-tooltip-title', 'Countries');
            countriesCounter.setAttribute('data-tooltip-type', 'countries');
            countriesCounter.addEventListener('click', showTooltip);
        }
        
        // Tokens Per Hero tooltip
        const tokensCounter = document.querySelector('.counter-item:nth-child(4)');
        if (tokensCounter) {
            tokensCounter.setAttribute('data-tooltip-title', 'Tokens Per Hero');
            tokensCounter.setAttribute('data-tooltip-type', 'tokens');
            tokensCounter.setAttribute('data-tooltip-content', 'Each member will receive 1B out of 100B Total Supply.');
            tokensCounter.addEventListener('click', showTooltip);
        }
        
        // Document click handler to close tooltip when clicking outside
        document.addEventListener('click', function(e) {
            const tooltip = document.querySelector('.tooltip');
            if (tooltip && 
                tooltip.style.display === 'block' && 
                !tooltip.contains(e.target) && 
                !e.target.closest('[data-tooltip-type]')) {
                hideTooltip();
            }
        });
    }

    function showTooltip(e) {
        e.stopPropagation();
        
        const element = e.currentTarget;
        const tooltipType = element.getAttribute('data-tooltip-type');
        const tooltipTitle = element.getAttribute('data-tooltip-title');
        
        // Create tooltip if it doesn't exist
        let tooltip = document.querySelector('.tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            document.body.appendChild(tooltip);
        }
        
        // Generate content based on tooltip type
        let content = '';
        
        if (tooltipType === 'countries') {
            const countriesListJSON = element.getAttribute('data-countries');
            if (!countriesListJSON) return;
            
            try {
                const countriesList = JSON.parse(countriesListJSON);
                if (countriesList.length === 0) return;
                
                content = '<div class="tooltip-list">';
                countriesList.forEach(country => {
                    content += `<div class="tooltip-item">${country}</div>`;
                });
                content += '</div>';
            } catch (error) {
                console.error('Error parsing countries data:', error);
                return;
            }
        } 
        else if (tooltipType === 'spots' || tooltipType === 'tokens') {
            // Get content from data attribute
            const tooltipContent = element.getAttribute('data-tooltip-content');
            content = `<div class="tooltip-text">${tooltipContent}</div>`;
        }
        
        // Set tooltip content with title and close button
        tooltip.innerHTML = `
            <div class="tooltip-close">×</div>
            <div class="tooltip-title">${tooltipTitle}</div>
            ${content}
        `;
        
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
                hideTooltip();
            });
        }
    }

    function hideTooltip() {
        const tooltip = document.querySelector('.tooltip');
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

////////////////////////////// 
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

