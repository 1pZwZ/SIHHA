document.addEventListener('DOMContentLoaded', () => {
    console.log('Sihha Fitness App Initialized');
    
    initTheme();
    initNavigation();
    initCalories();
});

function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');
    
    // Check local storage for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }
    
    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            icon.classList.replace('fa-sun', 'fa-moon');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            icon.classList.replace('fa-moon', 'fa-sun');
        }
    });
}

function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view-section');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and views
            navButtons.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            
            // Add active class to the clicked button
            btn.classList.add('active');
            
            // Show the corresponding view
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// Calories Logic
function initCalories() {
    const defaultGoal = 2000;
    
    // Get today's date string (YYYY-MM-DD) for local storage key
    const getTodayKey = () => {
        const today = new Date();
        return `calories_${today.getFullYear()}_${today.getMonth()+1}_${today.getDate()}`;
    };
    
    const todayKey = getTodayKey();
    
    // Load data from local storage
    let calData = JSON.parse(localStorage.getItem(todayKey)) || { consumed: 0, burned: 0 };
    
    const consumedEl = document.getElementById('cal-consumed');
    const burnedEl = document.getElementById('cal-burned');
    const netEl = document.getElementById('cal-net');
    const progressEl = document.getElementById('cal-progress');
    const amountInput = document.getElementById('cal-amount');
    
    const updateUI = () => {
        const net = calData.consumed - calData.burned;
        consumedEl.textContent = calData.consumed;
        burnedEl.textContent = calData.burned;
        netEl.textContent = net;
        
        // Update progress bar (cap at 100%)
        let progress = (calData.consumed / defaultGoal) * 100;
        if (progress > 100) progress = 100;
        progressEl.style.width = `${progress}%`;
        
        // Save to local storage
        localStorage.setItem(todayKey, JSON.stringify(calData));
    };
    
    document.getElementById('btn-add-food').addEventListener('click', () => {
        const val = parseInt(amountInput.value);
        if (!isNaN(val) && val > 0) {
            calData.consumed += val;
            updateUI();
            amountInput.value = '';
        }
    });
    
    document.getElementById('btn-add-burn').addEventListener('click', () => {
        const val = parseInt(amountInput.value);
        if (!isNaN(val) && val > 0) {
            calData.burned += val;
            updateUI();
            amountInput.value = '';
        }
    });
    
    document.getElementById('btn-reset-cal').addEventListener('click', () => {
        if(confirm("Are you sure you want to reset today's calories?")) {
            calData = { consumed: 0, burned: 0 };
            updateUI();
        }
    });
    
    // Initialize UI on load
    updateUI();
}
