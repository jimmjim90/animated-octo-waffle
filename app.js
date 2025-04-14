// app.js (v2 - With Levels & Quests)

// --- Polyfills & Setup ---
window.requestIdleCallback = window.requestIdleCallback || function (cb) { /* ... */ }; // Keep existing polyfill
window.cancelIdleCallback = window.cancelIdleCallback || function (id) { /* ... */ }; // Keep existing polyfill

// --- Constants ---

// XP required for each level (index corresponds to level - 1, e.g., index 0 is for level 1->2)
// Adjust this curve as desired
const XP_THRESHOLDS = [100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000]; // XP needed to reach level index+2

// XP awarded for various actions
const XP_VALUES = {
    QUEST_COMPLETE_BASE: 50, // Base XP for completing a quest (can be overridden in quest definition)
    SKILL_UNLOCK: 75,
    SIGIL_CREATE: 10,
    RED_GATE_USE: 5,
    KEYSTONE_MEMORY: 25, // Optional: If implementing keystone memories
};

// Pool of potential daily quests
const QUEST_POOL = [
    { id: "q001", title: "Contemplate the Void", description: "Reflect on the state *before* creation. What does 'potential' feel like? Log your insights.", xpValue: 50, linkToAction: "#memory-log" },
    { id: "q002", title: "Witness Genesis", description: "Observe 3 instances of 'beginnings' today (sunrise, starting a task, a new idea forming). Note them down.", xpValue: 40 },
    { id: "q003", title: "Channel Primordial Light", description: "Spend 5 minutes visualizing pure, brilliant light filling your being.", xpValue: 60, category: "Meditation" },
    { id: "q004", title: "Embrace Non-Duality", description: "Identify one pair of opposites in your life today (light/dark, order/chaos) and find the connection or synthesis between them.", xpValue: 50, category: "Contemplation"},
    { id: "q005", title: "Create from Potential", description: "Draw a sigil representing a new possibility or goal you want to manifest.", xpValue: 45, linkToAction: "#sigil-vault" },
    { id: "q006", title: "Orphic Echo", description: "Read a short text or poem related to Phanes, the Orphic mysteries, or a creation myth.", xpValue: 30, category: "Study"},
    { id: "q007", title: "Daily Ritual Alignment", description: "Perform your Daily Ritual with the specific intention of connecting to the source of creation/Phanes.", xpValue: 55, linkToAction: "#dashboard" },
    { id: "q008", title: "Stillness Practice", description: "Sit in complete silence for 5 minutes, observing the space from which thoughts arise.", xpValue: 60, category: "Meditation" },
    { id: "q009", title: "Synchronicity Scan", description: "Actively look for meaningful coincidences today. Log any findings.", xpValue: 40, linkToAction: "#memory-log" },
    { id: "q010", title: "Potential Mapping", description: "List 3 untapped potentials within yourself right now.", xpValue: 35, category: "Contemplation" }
];

const DAILY_INSIGHTS = [ /* ... keep existing insights ... */ ];

// --- State Variables ---
const AppState = {
    currentPage: 'dashboard',
    theme: localStorage.getItem('aethelos_theme') || 'dark',
    dailyRitual: localStorage.getItem('aethelos_dailyRitual') || '',
    memories: JSON.parse(localStorage.getItem('aethelos_memories') || '[]'),
    skills: JSON.parse(localStorage.getItem('aethelos_skills') || '[]'),
    sigils: JSON.parse(localStorage.getItem('aethelos_sigils') || '[]'),
    redGateMantra: localStorage.getItem('aethelos_redGateMantra') || 'Be Present. Be Calm.',
    // --- New State Variables ---
    level: parseInt(localStorage.getItem('aethelos_level') || '1', 10), // User's current level
    xp: parseInt(localStorage.getItem('aethelos_xp') || '0', 10),       // User's current XP within the level
    lastQuestCheckDate: localStorage.getItem('aethelos_lastQuestCheckDate') || '', // YYYY-MM-DD format
    activeQuests: JSON.parse(localStorage.getItem('aethelos_activeQuests') || '[]'), // { id: string, completed: boolean }[]
};

// --- DOM Elements ---
const pageContent = document.getElementById('page-content');
const navLinks = document.querySelectorAll('.nav-link');
const loadingOverlay = document.getElementById('loading-overlay');
const redGateOverlay = document.getElementById('red-gate-overlay');
const redGateMantraDisplay = document.getElementById('red-gate-mantra');
const redGateExitButton = document.getElementById('red-gate-exit');
const levelUpNotification = document.getElementById('level-up-notification'); // New element

// --- PWA Service Worker Registration ---
function registerServiceWorker() { /* ... keep existing function ... */ }

// --- Local Storage Utilities ---
// Updated saveData to handle potential non-JSON data gracefully if needed elsewhere
function saveData(key, data) {
    try {
        localStorage.setItem(`aethelos_${key}`, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving ${key} to localStorage:`, e);
        // alert("Error saving data. LocalStorage might be full or disabled.");
    }
}

// Updated loadData to handle potential parsing errors more robustly
function loadData(key, defaultValue = null) {
    const data = localStorage.getItem(`aethelos_${key}`);
    if (data === null) return defaultValue;
    try {
        // Attempt to parse arrays/objects
        if (data.startsWith('[') || data.startsWith('{')) {
            return JSON.parse(data);
        }
        // Attempt to parse numbers (level, xp)
        const num = parseInt(data, 10);
        if (!isNaN(num) && (key === 'level' || key === 'xp')) {
             return num;
        }
        // Return raw string for others (theme, ritual, mantra, date)
        return data;
    } catch (e) {
        console.error(`Error parsing key "${key}" from localStorage:`, e, `Raw data:`, data);
        // Fallback logic: return default or the raw string if appropriate
        if (typeof defaultValue === 'string' || key === 'theme' || key === 'dailyRitual' || key === 'redGateMantra' || key === 'lastQuestCheckDate') {
            return data; // Return raw string if parsing fails for expected string types
        }
        return defaultValue; // Return default for arrays/objects/numbers if parsing fails
    }
}


function saveTextData(key, text) { /* ... keep existing function ... */ }
function saveNumberData(key, number) {
     try {
        localStorage.setItem(`aethelos_${key}`, number.toString());
    } catch (e) {
        console.error(`Error saving number ${key} to localStorage:`, e);
    }
}

// --- Theme Management ---
function applyTheme(theme) { /* ... keep existing function ... */ }
function toggleTheme() { /* ... keep existing function ... */ }

// --- Routing / Page Loading ---
function loadPage(pageId) { /* ... keep existing function, ensure initPage is called ... */ }

// --- Page Initialization Router ---
function initPage(pageId) {
    console.log(`Initializing page: ${pageId}`);
    const pageElement = document.getElementById(pageId);
    if (!pageElement) { /* ... error handling ... */ return; }

    switch (pageId) {
        case 'dashboard': initDashboard(); break;
        case 'memory-log': initMemoryLog(); break;
        case 'skill-tree': initSkillTree(); break;
        case 'sigil-vault': initSigilVault(); break;
        case 'red-gate': initRedGate(); break;
        case 'settings': initSettings(); break;
        // case 'status': initStatusPage(); break; // If Status page is added
        default: console.warn(`No initializer found for page: ${pageId}`);
    }
}

// --- XP & Leveling System ---

/** Calculates the XP required to reach the next level. */
function getXPThreshold(level) {
    // Use the XP_THRESHOLDS array. Index is level - 1.
    // If level exceeds defined thresholds, maybe use a formula or cap it.
    if (level - 1 < XP_THRESHOLDS.length) {
        return XP_THRESHOLDS[level - 1];
    } else {
        // Example: Linear increase after the last defined threshold
        const lastDefinedLevel = XP_THRESHOLDS.length + 1;
        const lastThreshold = XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
        const increasePerLevel = 500; // Or calculate based on last few steps
        return lastThreshold + (level - lastDefinedLevel + 1) * increasePerLevel;
        // return Infinity; // Or cap leveling
    }
}

/** Updates the visual XP bar on the dashboard. */
function updateXPBar() {
    const xpBarFill = document.getElementById('xp-bar-fill');
    const xpDisplay = document.getElementById('xp-display');
    if (!xpBarFill || !xpDisplay) return; // Only run if dashboard elements exist

    const xpNeeded = getXPThreshold(AppState.level);
    const percentage = xpNeeded > 0 ? Math.min(100, (AppState.xp / xpNeeded) * 100) : 100;

    xpBarFill.style.width = `${percentage}%`;
    xpDisplay.textContent = `XP: ${AppState.xp} / ${xpNeeded}`;
}

/** Updates the displayed level on the dashboard. */
function updateLevelDisplay() {
     const levelDisplay = document.getElementById('attunement-level');
     if (levelDisplay) {
         levelDisplay.textContent = `Attunement Level: ${AppState.level}`;
     }
}

/** Displays the level up notification. */
function showLevelUpNotification() {
    levelUpNotification.textContent = `Attunement Level ${AppState.level} Reached!`;
    levelUpNotification.style.display = 'block';
    // Animation handles fade out via CSS
    // Reset display after animation finishes
    setTimeout(() => {
        levelUpNotification.style.display = 'none';
    }, 3000); // Match CSS animation duration
    playSoundEffect('level_up');
}

/** Checks if current XP triggers a level up. */
function checkForLevelUp() {
    const xpNeeded = getXPThreshold(AppState.level);
    if (AppState.xp >= xpNeeded) {
        AppState.level++;
        AppState.xp -= xpNeeded; // Subtract threshold, carry over excess XP
        saveNumberData('level', AppState.level);
        saveNumberData('xp', AppState.xp);
        updateLevelDisplay();
        updateXPBar(); // Update bar with new level threshold and remaining XP
        showLevelUpNotification();
        // Recursively check again in case multiple levels were gained (unlikely but possible)
        checkForLevelUp();
    }
}

/** Adds XP to the user's total and checks for level up. */
function addXP(amount) {
    if (amount <= 0) return;
    AppState.xp += amount;
    console.log(`Gained ${amount} XP. Total XP: ${AppState.xp}`);
    saveNumberData('xp', AppState.xp);
    updateXPBar(); // Update bar immediately
    checkForLevelUp(); // Check if this XP gain triggered a level up
}

// --- Daily Quest System ---

/** Gets today's date in YYYY-MM-DD format. */
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** Selects new daily quests if it's a new day. */
function generateDailyQuests() {
    const todayStr = getTodayDateString();
    if (AppState.lastQuestCheckDate === todayStr && AppState.activeQuests.length > 0) {
        console.log("Quests already generated for today.");
        return; // Quests already set for today
    }

    console.log("Generating new daily quests for", todayStr);
    AppState.lastQuestCheckDate = todayStr;
    AppState.activeQuests = [];
    const numberOfQuests = 3; // How many quests to generate daily

    // Simple random selection (can be improved to avoid repeats)
    let availableQuests = [...QUEST_POOL];
    for (let i = 0; i < numberOfQuests && availableQuests.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableQuests.length);
        const selectedQuest = availableQuests.splice(randomIndex, 1)[0]; // Remove selected quest
        AppState.activeQuests.push({ id: selectedQuest.id, completed: false });
    }

    saveTextData('lastQuestCheckDate', AppState.lastQuestCheckDate);
    saveData('activeQuests', AppState.activeQuests); // Save the list of {id, completed} objects
}

/** Renders the current daily quests on the dashboard. */
function renderDailyQuests() {
    const questListContainer = document.getElementById('daily-quests-list');
    if (!questListContainer) return; // Only run if dashboard is active

    questListContainer.innerHTML = ''; // Clear previous list

    if (AppState.activeQuests.length === 0) {
        questListContainer.innerHTML = '<p class="italic text-sm themed-text opacity-70">No directives available. Check back tomorrow.</p>';
        return;
    }

    AppState.activeQuests.forEach((activeQuest, index) => {
        const questData = QUEST_POOL.find(q => q.id === activeQuest.id);
        if (!questData) return; // Skip if quest data not found in pool

        const questDiv = document.createElement('div');
        questDiv.className = `quest-item border-b themed-border pb-2 mb-2 ${activeQuest.completed ? 'quest-completed' : ''}`;

        const xpReward = questData.xpValue || XP_VALUES.QUEST_COMPLETE_BASE;

        questDiv.innerHTML = `
            <label class="flex items-start themed-text">
                <input type="checkbox" class="quest-checkbox mt-1" data-quest-index="${index}" ${activeQuest.completed ? 'checked disabled' : ''}>
                <div class="flex-grow">
                    <span class="font-semibold">${escapeHtml(questData.title)} (+${xpReward} XP)</span>
                    <p class="text-xs opacity-80 mt-1">${escapeHtml(questData.description)}</p>
                    ${questData.linkToAction ? `<a href="${questData.linkToAction}" class="text-xs themed-link hover:underline block mt-1 nav-link-quest">Go to ${questData.linkToAction.substring(1)} &rarr;</a>` : ''}
                </div>
            </label>
        `;
        questListContainer.appendChild(questDiv);
    });

    // Add event listeners to checkboxes
    questListContainer.querySelectorAll('.quest-checkbox').forEach(checkbox => {
        if (!checkbox.disabled) { // Only add listener if not already completed
            checkbox.addEventListener('change', handleCompleteQuest);
        }
    });
     // Add listeners to internal links (optional, uses main nav logic)
     questListContainer.querySelectorAll('.nav-link-quest').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('href').substring(1);
            loadPage(pageId);
            window.location.hash = pageId;
        });
    });
}

/** Handles marking a quest as complete. */
function handleCompleteQuest(event) {
    const checkbox = event.target;
    const questIndex = parseInt(checkbox.dataset.questIndex, 10);

    if (isNaN(questIndex) || questIndex < 0 || questIndex >= AppState.activeQuests.length) {
        console.error("Invalid quest index:", questIndex);
        return;
    }

    const activeQuest = AppState.activeQuests[questIndex];
    if (activeQuest.completed) return; // Should be disabled, but double-check

    activeQuest.completed = true;
    checkbox.disabled = true; // Disable checkbox after completion
    checkbox.closest('.quest-item').classList.add('quest-completed'); // Add visual style

    saveData('activeQuests', AppState.activeQuests); // Save updated completion status

    // Grant XP
    const questData = QUEST_POOL.find(q => q.id === activeQuest.id);
    const xpReward = questData?.xpValue || XP_VALUES.QUEST_COMPLETE_BASE;
    addXP(xpReward);

    playSoundEffect('quest_complete');

    // Optionally re-render quests if needed, though styling might be sufficient
    // renderDailyQuests();
}


// --- Feature Initializers (Updated) ---

function initDashboard() {
    const welcomeMsg = document.getElementById('welcome-message');
    const dailyRitualInput = document.getElementById('daily-ritual');
    const activateAvatarBtn = document.getElementById('activate-avatar');
    const avatarEffect = document.getElementById('avatar-effect');
    const dailyInsight = document.getElementById('daily-insight');
    // New elements for level/XP
    const levelDisplay = document.getElementById('attunement-level');
    const xpBarFill = document.getElementById('xp-bar-fill');
    const xpDisplay = document.getElementById('xp-display');
    const questListContainer = document.getElementById('daily-quests-list');


    if (!welcomeMsg || !dailyRitualInput || !activateAvatarBtn || !avatarEffect || !dailyInsight || !levelDisplay || !xpBarFill || !xpDisplay || !questListContainer) {
        console.error("Dashboard elements missing. Cannot initialize fully.");
        // Allow partial init if possible
    }

    // Set welcome message
    const now = new Date();
    if(welcomeMsg) welcomeMsg.textContent = `Welcome, Initiate. System Time: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    // Set random daily insight
    if(dailyInsight) dailyInsight.textContent = `"${DAILY_INSIGHTS[Math.floor(Math.random() * DAILY_INSIGHTS.length)]}"`;

    // Load and save daily ritual
    if(dailyRitualInput) {
        dailyRitualInput.value = AppState.dailyRitual;
        dailyRitualInput.addEventListener('input', (e) => {
            AppState.dailyRitual = e.target.value;
            saveTextData('dailyRitual', AppState.dailyRitual);
        });
    }

    // Avatar State button effect
    if(activateAvatarBtn && avatarEffect) {
        activateAvatarBtn.addEventListener('click', () => {
            avatarEffect.style.width = '0%';
            void avatarEffect.offsetWidth;
            avatarEffect.style.width = '100%';
            setTimeout(() => { avatarEffect.style.width = '0%'; }, 1500);
            playSoundEffect('activate');
        });
    }

    // --- New Initializations for Level & Quests ---
    updateLevelDisplay(); // Display current level
    updateXPBar(); // Display current XP bar state
    generateDailyQuests(); // Check if new quests need to be generated
    renderDailyQuests(); // Display the quests for today
}

function initMemoryLog() {
    // ... (existing initMemoryLog code) ...

    // --- Modification: Add Keystone Memory Button Listener (Optional) ---
    function renderMemories(filter = '') {
        // ... (start of existing renderMemories) ...

        filteredMemories.forEach((mem, index) => {
            const div = document.createElement('div');
            div.className = 'border themed-border p-3 rounded text-sm relative mb-3';
            const date = new Date(mem.timestamp).toLocaleString();
            const originalIndex = AppState.memories.findIndex(m => m.timestamp === mem.timestamp);

            // Add Keystone button if implementing this feature
            const keystoneButtonHtml = `
                <button data-index="${originalIndex}" class="keystone-memory-btn absolute bottom-2 right-2 text-xs themed-accent-text hover:underline p-1 ${mem.isKeystone ? 'opacity-50 cursor-default' : ''}" title="${mem.isKeystone ? 'Keystone Memory' : 'Mark as Keystone (+'+XP_VALUES.KEYSTONE_MEMORY+' XP)'}" ${mem.isKeystone ? 'disabled' : ''}>
                    ${mem.isKeystone ? '✦' : '✧'}
                </button>
            `;

            div.innerHTML = `
                <p class="font-jetbrains text-xs mb-1 themed-accent-text">${date}</p>
                <p class="whitespace-pre-wrap themed-text pr-16 pb-4">${escapeHtml(mem.text)}</p> <button data-index="${originalIndex}" class="delete-memory-btn absolute top-2 right-2 text-xs themed-danger-text hover:underline p-1" title="Delete Memory">&times;</button>
                ${XP_VALUES.KEYSTONE_MEMORY > 0 ? keystoneButtonHtml : ''} `;
            listContainer.appendChild(div);
        });

        // Add delete listeners
        listContainer.querySelectorAll('.delete-memory-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteMemory);
        });

        // Add keystone listeners (if feature enabled)
        if (XP_VALUES.KEYSTONE_MEMORY > 0) {
            listContainer.querySelectorAll('.keystone-memory-btn:not([disabled])').forEach(btn => {
                btn.addEventListener('click', handleMarkKeystoneMemory);
            });
        }
    }

    // Function to handle marking a memory as keystone (Optional)
    function handleMarkKeystoneMemory(event) {
        const index = parseInt(event.target.dataset.index, 10);
        if (isNaN(index) || index < 0 || index >= AppState.memories.length) return;

        const memory = AppState.memories[index];
        if (memory.isKeystone) return; // Already marked

        if (confirm(`Mark this memory as a Keystone? (+${XP_VALUES.KEYSTONE_MEMORY} XP)`)) {
            memory.isKeystone = true;
            addXP(XP_VALUES.KEYSTONE_MEMORY);
            saveData('memories', AppState.memories);
            renderMemories(document.getElementById('memory-search')?.value || ''); // Re-render to update button state
            playSoundEffect('unlock'); // Use unlock sound or a specific one
        }
    }

    // ... (rest of existing initMemoryLog: handleAddMemory, handleDeleteMemory, listeners, initial call) ...
    // Make sure handleAddMemory adds `isKeystone: false` to new memories if implementing
    function handleAddMemory() {
        const text = entryInput.value.trim();
        if (!text) return;
        const newMemory = { text: text, timestamp: Date.now(), isKeystone: false }; // Add isKeystone flag
        // ... rest of handleAddMemory
    }

    addBtn.addEventListener('click', handleAddMemory);
    searchInput.addEventListener('input', (e) => renderMemories(e.target.value));
    renderMemories(); // Initial render
}


function initSkillTree() {
    // ... (existing initSkillTree code: element getters, renderSkills, handleAddSkill, handleDeleteSkill) ...

    // --- Modification: Add XP gain on skill unlock ---
    function handleToggleSkill(event) {
        const index = parseInt(event.target.dataset.index, 10);
        if (index >= 0 && index < AppState.skills.length) {
            const skill = AppState.skills[index];
            const wasUnlocked = skill.unlocked; // Check status *before* changing
            const isNowUnlocked = event.target.checked;

            skill.unlocked = isNowUnlocked; // Update state
            saveData('skills', AppState.skills); // Persist changes
            renderSkills(); // Re-render to reflect visual changes

            // Grant XP only when changing from locked to unlocked
            if (isNowUnlocked && !wasUnlocked) {
                addXP(XP_VALUES.SKILL_UNLOCK);
                playSoundEffect('unlock');
            } else if (!isNowUnlocked && wasUnlocked) {
                 // Optional: Remove XP if skill is re-locked? Generally not done in games.
                 playSoundEffect('lock');
            } else {
                 // Play sound even if state didn't change (e.g., clicking already checked)
                 playSoundEffect(isNowUnlocked ? 'unlock' : 'lock');
            }
        }
    }

    // Re-attach listeners after rendering in renderSkills()
    function renderSkills() {
        // ... (existing renderSkills code) ...
         listContainer.querySelectorAll('.toggle-skill-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleToggleSkill); // Ensure this uses the modified handler
        });
        listContainer.querySelectorAll('.delete-skill-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteSkill);
        });
    }

    // ... (rest of existing initSkillTree: listeners, initial call) ...
    addBtn.addEventListener('click', handleAddSkill);
    renderSkills();
}

function initSigilVault() {
    // ... (existing initSigilVault code: element getters, canvas setup, drawing logic, renderSigils, handleDeleteSigil) ...

    // --- Modification: Add XP gain on saving sigil ---
    function handleSaveSigil() {
        const name = nameInput.value.trim() || `Sigil_${Date.now()}`;
        const imageData = canvas.toDataURL('image/png');

        // Optional: Add empty canvas check here

        const newSigil = { name: name, imageData: imageData, timestamp: Date.now() };
        AppState.sigils.push(newSigil);
        saveData('sigils', AppState.sigils);

        // --- Add XP ---
        addXP(XP_VALUES.SIGIL_CREATE);
        // --- End Add XP ---

        nameInput.value = '';
        clearCanvas();
        renderSigils();
        playSoundEffect('save');
    }

    // ... (rest of existing initSigilVault: listeners, initial call) ...
     saveBtn.addEventListener('click', handleSaveSigil); // Ensure this uses the modified handler
     clearBtn.addEventListener('click', clearCanvas);
     setupCanvasStyle();
     renderSigils();
}

function initRedGate() {
    // ... (existing initRedGate code: element getters, mantra handling, activate button listener) ...

    // --- Modification: Add XP gain on exiting Red Gate ---
    // Modify the activateBtn listener or the hideRedGateOverlay function
    activateBtn.addEventListener('click', () => {
         // ... (existing Tone.start logic) ...
         startRedGateAudio();
         showRedGateOverlay();
         // Add a flag or timestamp to track entry? Or just grant XP on exit.
         AppState.enteredRedGate = true; // Simple flag example
     });

     // Modify hideRedGateOverlay
     function hideRedGateOverlay() {
        redGateOverlay.classList.remove('active');
        stopRedGateAudio();
        redGateExitButton.onclick = null;
        // --- Grant XP if flag was set ---
        if (AppState.enteredRedGate) {
            addXP(XP_VALUES.RED_GATE_USE);
            AppState.enteredRedGate = false; // Reset flag
        }
        // --- End Grant XP ---
    }

     // ... (rest of initRedGate) ...
}


function initSettings() {
    // ... (existing initSettings code: element getters, listeners for theme/export/import/clear) ...

    // --- Modification: Update Export/Import/Clear Data ---
    function exportData() {
        const dataToExport = {};
        // Include new state variables in export
        const keysToExport = ['theme', 'dailyRitual', 'memories', 'skills', 'sigils', 'redGateMantra', 'level', 'xp', 'lastQuestCheckDate', 'activeQuests'];

        keysToExport.forEach(key => {
            // Use AppState directly for runtime values, or localStorage for persisted ones
            // Using AppState is generally safer if it's guaranteed to be up-to-date
            if (AppState[key] !== undefined && AppState[key] !== null) {
                dataToExport[key] = AppState[key];
            }
            // Or retrieve from localStorage:
            // const storageKey = `aethelos_${key}`;
            // const storedValue = localStorage.getItem(storageKey);
            // if (storedValue !== null) { /* ... parsing logic ... */ }
        });

        if (Object.keys(dataToExport).length === 0) { /* ... */ return; }
        const jsonString = JSON.stringify(dataToExport, null, 2);
        // ... (rest of blob creation and download logic) ...
        playSoundEffect('export');
    }

    function handleImportData(event) { // Renamed from importData for clarity
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (confirm("Importing data will overwrite current data. Proceed?")) {
                    // Clear existing relevant state AND localStorage before importing
                    const keysToImport = ['theme', 'dailyRitual', 'memories', 'skills', 'sigils', 'redGateMantra', 'level', 'xp', 'lastQuestCheckDate', 'activeQuests'];
                    keysToImport.forEach(key => {
                        localStorage.removeItem(`aethelos_${key}`);
                        // Reset AppState defaults (primitives)
                        if (typeof AppState[key] === 'string') AppState[key] = '';
                        if (typeof AppState[key] === 'number') AppState[key] = (key === 'level' ? 1 : 0);
                        if (Array.isArray(AppState[key])) AppState[key] = [];
                    });
                    AppState.theme = 'dark'; // Reset theme default

                    // Import and save each piece of data found in the file
                    Object.keys(importedData).forEach(key => {
                        if (keysToImport.includes(key)) {
                            const value = importedData[key];
                            AppState[key] = value; // Update runtime state

                            // Save to localStorage correctly based on type
                            if (typeof value === 'object' && value !== null) {
                                saveData(key, value); // Use JSON.stringify
                            } else if (typeof value === 'number') {
                                saveNumberData(key, value);
                            } else if (value !== null) {
                                saveTextData(key, value.toString());
                            }
                        }
                    });

                    // Apply imported theme
                    applyTheme(AppState.theme);

                    alert("Data imported successfully! Reloading application.");
                    location.reload();
                }
            } catch (err) { /* ... error handling ... */ }
            finally { event.target.value = null; }
        };
        reader.readAsText(file);
    }

    function clearAllData() {
        if (confirm("WARNING: This will permanently delete ALL your saved data... Are you absolutely sure?")) {
            if (confirm("FINAL CONFIRMATION: Really delete everything?")) {
                // Clear localStorage keys used by the app
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('aethelos_')) {
                        localStorage.removeItem(key);
                    }
                });
                alert("All data cleared. Reloading application.");
                playSoundEffect('delete');
                location.reload(); // Reload to reset state fully
            }
        }
    }

    // Re-attach listeners
    toggleThemeBtn.addEventListener('click', toggleTheme);
    exportBtn.addEventListener('click', exportData);
    importInput.addEventListener('change', handleImportData);
    clearDataBtn.addEventListener('click', clearAllData);
}

// --- Sound Effects (Updated) ---
function playSoundEffect(type) {
    if (typeof Tone === 'undefined' || !Tone.start) return;

    Tone.start().then(() => {
        let synth;
        let duration = 200;

        try {
            switch (type) {
                // --- Keep existing sounds ---
                case 'activate': /* ... */ break;
                case 'log': case 'add': /* ... */ break;
                case 'save': /* ... */ break;
                case 'delete': case 'clear': /* ... */ break;
                case 'unlock': /* ... */ break;
                case 'lock': /* ... */ break;
                case 'export': /* ... */ break;

                // --- New Sounds ---
                case 'level_up':
                    // More prominent, ascending sound
                    synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.4 } }).toDestination();
                    synth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "8n", Tone.now());
                    duration = 500;
                    break;
                case 'quest_complete':
                    // Short, positive chime
                    synth = new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.1, release: 0.05 }, harmonicity: 3.1, modulationIndex: 16, resonance: 4000, octaves: 1.5 }).toDestination();
                    synth.triggerAttackRelease("16n", Tone.now());
                    duration = 200;
                    break;

                default: return;
            }

            // Auto-dispose synth
            if (synth && typeof synth.dispose === 'function') {
                setTimeout(() => { synth.dispose(); }, duration + 50); // Add buffer
            }

        } catch (err) { /* ... error handling ... */ }
    }).catch(error => { /* ... error handling ... */ });
}


// --- Utility Functions ---
function escapeHtml(unsafe) { /* ... keep existing function ... */ }

// --- Initialization ---
function initApp() {
    // Apply initial theme
    applyTheme(AppState.theme);

    // Set up navigation
    navLinks.forEach(link => { /* ... keep existing listener ... */ });

     // Handle initial page load based on hash or default to dashboard
    const initialPage = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
    if (document.getElementById(`page-${initialPage}`)) {
         loadPage(initialPage);
    } else {
         loadPage('dashboard');
         window.location.hash = 'dashboard';
    }

    // Register Service Worker
    registerServiceWorker();

    // Add keyboard shortcuts (optional)
    document.addEventListener('keydown', (e) => { /* ... keep existing listener ... */ });

    // Hide loading overlay
    requestIdleCallback(() => { /* ... keep existing logic ... */ });

     console.log("Aethel OS Initialized (v2).");
}

// --- Global Event Listeners ---
window.addEventListener('hashchange', () => { /* ... keep existing listener ... */ });

// Start the application
document.addEventListener('DOMContentLoaded', initApp);

