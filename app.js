import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, setDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCGoTFuwaCSXbpKCs20pOyOgHbWnTg1GA0",
  authDomain: "sihha-ab065.firebaseapp.com",
  projectId: "sihha-ab065",
  storageBucket: "sihha-ab065.firebasestorage.app",
  messagingSenderId: "425350677386",
  appId: "1:425350677386:web:373f74729eacdfa4717e73"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let globalFoods = [];

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initTimer();
    setupAuth();
});

function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }
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
            navButtons.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

function setupAuth() {
    const authOverlay = document.getElementById('auth-container');
    const emailInput = document.getElementById('auth-email');
    const passInput = document.getElementById('auth-password');
    const loginBtn = document.getElementById('btn-login');
    const signupBtn = document.getElementById('btn-signup');
    const errorEl = document.getElementById('auth-error');
    const logoutBtn = document.getElementById('auth-logout');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            authOverlay.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            await loadGlobalFoods();
            initDailyLog();
            initReports();
            initSchedule();
        } else {
            currentUser = null;
            authOverlay.style.display = 'flex';
            logoutBtn.style.display = 'none';
        }
    });

    loginBtn.addEventListener('click', async () => {
        try {
            errorEl.textContent = '';
            await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
        } catch (e) {
            errorEl.textContent = "Login Failed: " + e.message;
        }
    });

    signupBtn.addEventListener('click', async () => {
        try {
            errorEl.textContent = '';
            await createUserWithEmailAndPassword(auth, emailInput.value, passInput.value);
        } catch (e) {
            errorEl.textContent = "Sign Up Failed: " + e.message;
        }
    });

    logoutBtn.addEventListener('click', () => {
        signOut(auth);
    });
}

async function loadGlobalFoods() {
    const foodsRef = collection(db, "foods");
    const snapshot = await getDocs(foodsRef);
    
    if (snapshot.empty) {
        // Seed default foods if the global collection is empty
        const defaultFoods = [
            { name: "Chicken Breast", calPerUnit: 165, proPerUnit: 31, unit: "100 grams" },
            { name: "White Rice", calPerUnit: 130, proPerUnit: 2.7, unit: "100 grams" },
            { name: "Egg", calPerUnit: 68, proPerUnit: 5.5, unit: "pieces" },
            { name: "Apple", calPerUnit: 52, proPerUnit: 0.3, unit: "100 grams" },
            { name: "Banana", calPerUnit: 89, proPerUnit: 1.1, unit: "100 grams" },
            { name: "Oats", calPerUnit: 389, proPerUnit: 16.9, unit: "100 grams" },
            { name: "Whey Protein Scoop", calPerUnit: 120, proPerUnit: 24, unit: "pieces" }
        ];
        for (const food of defaultFoods) {
            await addDoc(foodsRef, food);
        }
        globalFoods = defaultFoods;
    } else {
        globalFoods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Populate Select Dropdown
    const select = document.getElementById('food-select');
    select.innerHTML = '<option value="">Select a food...</option>';
    globalFoods.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.name;
        opt.textContent = `${f.name} (${f.calPerUnit} kcal / ${f.unit})`;
        select.appendChild(opt);
    });

    // Adapt Quantity Label dynamically
    const qtyLabel = document.getElementById('food-qty-label');
    select.addEventListener('change', () => {
        const selected = globalFoods.find(f => f.name === select.value);
        if (selected) {
            qtyLabel.textContent = `Quantity (${selected.unit})`;
        } else {
            qtyLabel.textContent = 'Quantity';
        }
    });
}

function initDailyLog() {
    const defaultGoal = 2000;
    const today = new Date();
    // Key formatted strictly as YYYY-MM-DD
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // The specific document for today's logs
    const logRef = doc(db, `users/${currentUser.uid}/logs/${dateStr}`);
    
    const consumedEl = document.getElementById('cal-consumed');
    const burnedEl = document.getElementById('cal-burned');
    const netEl = document.getElementById('cal-net');
    const proEl = document.getElementById('pro-consumed');
    const progressEl = document.getElementById('cal-progress');
    const logList = document.getElementById('food-log-list');

    // Listen to changes securely from Firestore in real-time
    onSnapshot(logRef, (docSnap) => {
        let logData = { foods: [], workouts: [], totalCalConsumed: 0, totalCalBurned: 0, totalProConsumed: 0 };
        if (docSnap.exists()) {
            logData = docSnap.data();
        }

        // Update Statistics
        const net = logData.totalCalConsumed - logData.totalCalBurned;
        consumedEl.textContent = logData.totalCalConsumed.toFixed(0);
        burnedEl.textContent = logData.totalCalBurned.toFixed(0);
        netEl.textContent = net.toFixed(0);
        proEl.textContent = logData.totalProConsumed.toFixed(1);
        
        let progress = (logData.totalCalConsumed / defaultGoal) * 100;
        if (progress > 100) progress = 100;
        progressEl.style.width = `${progress}%`;

        // Render List
        logList.innerHTML = '';
        if (logData.foods.length === 0) {
            logList.innerHTML = '<p class="text-muted" style="font-size: 0.9rem;">No items logged today.</p>';
        } else {
            logData.foods.forEach(f => {
                const item = document.createElement('div');
                item.style.padding = '0.5rem';
                item.style.borderBottom = '1px solid var(--border)';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.innerHTML = `
                    <div><strong>${f.name}</strong> <span class="text-muted" style="font-size:0.8rem">(${f.qty} ${f.unit})</span></div>
                    <div style="text-align:right;">
                        <div>${f.calories.toFixed(0)} kcal</div>
                        <div class="text-muted" style="font-size:0.8rem; color: var(--success);">${f.protein.toFixed(1)}g pro</div>
                    </div>
                `;
                logList.appendChild(item);
            });
        }
    });

    // Add Food Handler
    document.getElementById('btn-add-food').addEventListener('click', async () => {
        const select = document.getElementById('food-select');
        const qtyInput = document.getElementById('food-qty');
        const selectedFood = globalFoods.find(f => f.name === select.value);
        const qty = parseFloat(qtyInput.value);

        if (selectedFood && qty > 0) {
            let ratio = 1;
            if (selectedFood.unit === '100 grams') {
                ratio = qty / 100; // e.g., 250 grams = 2.5 multiplier
            } else if (selectedFood.unit === 'pieces') {
                ratio = qty;       // e.g., 3 pieces = 3 multiplier
            }

            const addedCal = selectedFood.calPerUnit * ratio;
            const addedPro = selectedFood.proPerUnit * ratio;

            const newFood = {
                name: selectedFood.name,
                qty: qty,
                unit: selectedFood.unit === '100 grams' ? 'grams' : 'pieces',
                calories: addedCal,
                protein: addedPro,
                timestamp: new Date().toISOString()
            };

            const docSnap = await getDoc(logRef);
            let logData = { foods: [], workouts: [], totalCalConsumed: 0, totalCalBurned: 0, totalProConsumed: 0 };
            if (docSnap.exists()) {
                logData = docSnap.data();
            }

            logData.foods.push(newFood);
            logData.totalCalConsumed += addedCal;
            logData.totalProConsumed += addedPro;

            // Save to Firestore
            await setDoc(logRef, logData);
            
            // Clear inputs
            qtyInput.value = '';
            select.value = '';
        } else {
            alert('Please select a food and enter a valid quantity.');
        }
    });
}

function initReports() {
    const monthInput = document.getElementById('report-month');
    const today = new Date();
    // Default to current month YYYY-MM
    monthInput.value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2, '0')}`;
    
    document.getElementById('btn-generate-report').addEventListener('click', async () => {
        const monthStr = monthInput.value; // "YYYY-MM"
        if (!monthStr) return;
        
        // Fetch all logs and filter by month string prefix
        const logsRef = collection(db, `users/${currentUser.uid}/logs`);
        const snapshot = await getDocs(logsRef);
        
        let daysActive = 0;
        let totalPro = 0;
        let totalConsumed = 0;
        let totalBurned = 0;
        
        snapshot.forEach(doc => {
            const id = doc.id; // YYYY-MM-DD
            if (id.startsWith(monthStr)) {
                const data = doc.data();
                if (data.foods.length > 0 || data.workouts.length > 0) {
                    daysActive++;
                }
                totalPro += data.totalProConsumed || 0;
                totalConsumed += data.totalCalConsumed || 0;
                totalBurned += data.totalCalBurned || 0;
            }
        });
        
        document.getElementById('rep-days').textContent = daysActive;
        document.getElementById('rep-pro').textContent = totalPro.toFixed(0) + 'g';
        document.getElementById('rep-consumed').textContent = totalConsumed.toFixed(0) + ' kcal';
        document.getElementById('rep-burned').textContent = totalBurned.toFixed(0) + ' kcal';
        
        document.getElementById('report-results').style.display = 'block';
    });
}

async function initSchedule() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const scheduleList = document.getElementById('schedule-list');
    scheduleList.innerHTML = ''; // Prevent duplicates on re-login
    
    // Create UI
    days.forEach(day => {
        const div = document.createElement('div');
        div.style.marginBottom = '1rem';
        div.innerHTML = `
            <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.25rem;">${day}</label>
            <div style="display:flex; gap:0.5rem; align-items:center;">
                <input type="checkbox" id="chk-${day}" style="width:20px; height:20px; cursor:pointer;">
                <input type="text" id="txt-${day}" placeholder="Rest day" style="flex:1; padding:0.5rem; border-radius:0.5rem; border:1px solid var(--border); background:var(--background); color:var(--text-main);">
            </div>
        `;
        scheduleList.appendChild(div);
    });

    // Fetch existing schedule from Firestore
    const schedRef = doc(db, `users/${currentUser.uid}/schedule/weekly`);
    const docSnap = await getDoc(schedRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        days.forEach(day => {
            if (data[day]) {
                document.getElementById(`txt-${day}`).value = data[day].text || '';
                document.getElementById(`chk-${day}`).checked = data[day].done || false;
            }
        });
    }

    // Save logic
    const saveBtn = document.getElementById('btn-save-schedule');
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    newSaveBtn.addEventListener('click', async () => {
        const scheduleData = {};
        days.forEach(day => {
            scheduleData[day] = {
                text: document.getElementById(`txt-${day}`).value,
                done: document.getElementById(`chk-${day}`).checked
            };
        });
        
        await setDoc(schedRef, scheduleData);
        alert('Weekly schedule saved to the cloud!');
    });
}

function initTimer() {
    let timerInterval = null;
    let seconds = 0;
    
    const display = document.getElementById('timer-display');
    const btnStart = document.getElementById('btn-timer-start');
    const btnPause = document.getElementById('btn-timer-pause');
    const btnReset = document.getElementById('btn-timer-reset');

    const updateDisplay = () => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        display.textContent = `${m}:${s}`;
    };

    btnStart.addEventListener('click', () => {
        if (!timerInterval) {
            timerInterval = setInterval(() => {
                seconds++;
                updateDisplay();
            }, 1000);
        }
    });

    btnPause.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
    });

    btnReset.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        seconds = 0;
        updateDisplay();
    });
}
