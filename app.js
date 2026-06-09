document.addEventListener('DOMContentLoaded', () => {
    console.log('Sihha Fitness App Initialized');
    
    initTheme();
    initNavigation();
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
