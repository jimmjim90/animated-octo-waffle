// app.js

// --- Polyfills & Setup ---
// Basic polyfill for requestIdleCallback if needed (though modern browsers support it)
window.requestIdleCallback = window.requestIdleCallback || function (cb) {
    var start = Date.now();
    return setTimeout(function () {
        cb({
            didTimeout: false,
            timeRemaining: function () {
                return Math.max(0, 50 - (Date.now() - start));
            }
        });
    }, 1);
};

window.cancelIdleCallback = window.cancelIdleCallback || function (id) {
    clearTimeout(id);
};

// --- Constants & State ---
const AppState = {
    currentPage: 'dashboard',
    theme: localStorage.getItem('aethelos_theme') || 'dark',
    dailyRitual: localStorage.getItem('aethelos_dailyRitual') || '',
    memories: JSON.parse(localStorage.getItem('aethelos_memories') || '[]'),
    skills: JSON.parse(localStorage.getItem('aethelos_skills') || '[]'),
    sigils: JSON.parse(localStorage.getItem('aethelos_sigils') || '[]'),
    redGateMantra: localStorage.getItem('aethelos_redGateMantra') || 'Be Present. Be Calm.',
    // Add more state variables as needed
};

const DAILY_INSIGHTS = [
    "The unseen is revealed to those who look.",
    "Synchronicity is the universe whispering.",
    "Your focus shapes your reality.",
    "Inner alchemy transforms lead into gold.",
    "Listen to the silence; it speaks volumes.",
    "Every ending is a new beginning in disguise.",
    "The key is within you; seek it.",
    "Energy flows where attention goes.",
    "Trust the unfolding.",
    "Embrace the mystery."
];

// --- DOM Elements ---
const pageContent = document.getElementById('page-content');
const navLinks = document.querySelectorAll('.nav-link');
const loadingOverlay = document.getElementById('loading-overlay');
const redGateOverlay = document.getElementById('red-gate-overlay');
const redGateMantraDisplay = document.getElementById('red-gate-mantra');
const redGateExitButton = document.getElementById('red-gate-exit');

// --- PWA Service Worker Registration ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        // Ensure the path is correct based on deployment (root or subdirectory)
        // For GitHub Pages repo like 'username.github.io/repo-name/', the path might need '/repo-name/' prefix
        // Let's assume root or smart handling by browser for now. If issues arise, adjust path/scope.
        navigator.serviceWorker.register('service-worker.js') // Path relative to origin
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    } else {
        console.warn('Service Worker not supported in this browser.');
    }
}

// --- Local Storage Utilities ---
function saveData(key, data) {
    try {
        localStorage.setItem(`aethelos_${key}`, JSON.stringify(data));
    } catch (e) {
        console.error("Error saving to localStorage:", e);
        alert("Error saving data. LocalStorage might be full or disabled.");
    }
}

function loadData(key, defaultValue = null) {
    const data = localStorage.getItem(`aethelos_${key}`);
    if (data === null) return defaultValue;
    try {
        // Try parsing as JSON first
        return JSON.parse(data);
    } catch (e) {
        // If parsing fails, assume it was stored as plain text (for theme, ritual, mantra)
        console.warn(`Could not parse key "${key}" as JSON, returning raw string.`);
        return data; // Return the raw string value
    }
}


function saveTextData(key, text) {
     try {
        localStorage.setItem(`aethelos_${key}`, text);
    } catch (e) {
        console.error("Error saving text to localStorage:", e);
    }
}

// --- Theme Management ---
function applyTheme(theme) {
    document.body.classList.remove('light-theme', 'dark-theme');
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.add('dark-theme'); // Default to dark
    }
    // Update theme color meta tag for PWA consistency
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
        themeColorMeta.content = theme === 'light' ? '#f0f0f5' : '#1a1a2e';
    }
    AppState.theme = theme;
    saveTextData('theme', theme); // Save theme preference as text

    // Update canvas style if sigil vault page is active/loaded
    if (AppState.currentPage === 'sigil-vault') {
        const canvas = document.getElementById('sigil-canvas');
        if (canvas) {
             // Re-run the setup function which clears and sets colors
             // Need to ensure initSigilVault or a dedicated style function is available
             // For now, let's assume setupCanvasStyle exists and is accessible
             // or call a simplified version here.
             const ctx = canvas.getContext('2d');
             if(ctx) {
                ctx.strokeStyle = AppState.theme === 'light' ? '#1a1a2e' : '#e0e0e0';
                ctx.fillStyle = AppState.theme === 'light' ? '#ffffff' : '#1a1a2e';
                // Note: This only changes future drawing colors, doesn't redraw the canvas content itself
                // A full redraw might be needed if you want the background to change instantly
                // For simplicity, we just update the context state.
                // Calling setupCanvasStyle() from initSigilVault would be better if possible.
             }

        }
    }
}


function toggleTheme() {
    const newTheme = AppState.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

// --- Routing / Page Loading ---
function loadPage(pageId) {
    // Hide all pages currently in the DOM within #page-content
    document.querySelectorAll('#page-content > .page').forEach(page => {
        page.classList.remove('active');
        // Optional: could remove inactive pages from DOM to save memory,
        // but keeping them simplifies state persistence within the page elements.
    });

    // Find the target page div by ID
    let targetPage = document.getElementById(pageId);

    if (!targetPage) {
        // If page div doesn't exist in DOM, clone it from the template
        const template = document.getElementById(`page-${pageId}`);
        if (template) {
            const clone = template.content.cloneNode(true);
            // The first element in the template's content should be the page div
            const pageDiv = clone.querySelector('.page'); // Find the .page element within the clone

            if (pageDiv) {
                 // Ensure the cloned page div has the correct ID
                if (!pageDiv.id) {
                    pageDiv.id = pageId;
                }
                targetPage = pageDiv; // This is the element we'll append
                pageContent.appendChild(targetPage); // Add the new page structure to the DOM
                // Initialize page-specific content/listeners *after* adding to DOM
                // Use requestIdleCallback to avoid blocking rendering
                 requestIdleCallback(() => initPage(pageId));
            } else {
                 console.error(`Template for page ${pageId} does not contain a .page element.`);
                 if (pageId !== 'dashboard') loadPage('dashboard'); // Fallback
                 return;
            }
        } else {
            console.error(`Template for page ${pageId} not found.`);
            if (pageId !== 'dashboard') loadPage('dashboard'); // Fallback to dashboard
            return;
        }
    }

    // Show the target page (whether existing or newly cloned)
    targetPage.classList.add('active');
    AppState.currentPage = pageId;

    // Update nav link styles to highlight the active page
    navLinks.forEach(link => {
        const linkPageId = link.getAttribute('href').substring(1); // Get page ID from link href
        if (linkPageId === pageId) {
            link.classList.add('font-bold', 'themed-accent-text');
            link.classList.remove('themed-link', 'themed-danger-text'); // Remove other styles
        } else {
            link.classList.remove('font-bold', 'themed-accent-text');
            link.classList.add('themed-link'); // Ensure it has the default link style
            // Special handling for Red Gate link color when inactive
            if(linkPageId === 'red-gate') {
                link.classList.add('themed-danger-text');
            } else {
                 link.classList.remove('themed-danger-text');
            }
        }
    });

    // Scroll to the top of the page on navigation
    window.scrollTo(0, 0);
}


// --- Page Initialization ---
// This function acts as a router to call the specific setup function for the loaded page.
function initPage(pageId) {
    console.log(`Initializing page: ${pageId}`);
    // Ensure the page element exists before trying to initialize
    const pageElement = document.getElementById(pageId);
    if (!pageElement) {
        console.error(`Cannot initialize page: Element with ID ${pageId} not found in DOM.`);
        return;
    }

    // Call the corresponding initializer function
    switch (pageId) {
        case 'dashboard':
            initDashboard();
            break;
        case 'memory-log':
            initMemoryLog();
            break;
        case 'skill-tree':
            initSkillTree();
            break;
        case 'sigil-vault':
            initSigilVault();
            break;
        case 'red-gate':
            initRedGate();
            break;
        case 'settings':
            initSettings();
            break;
        default:
            console.warn(`No initializer found for page: ${pageId}`);
    }
}


// --- Feature Initializers ---

function initDashboard() {
    // Get elements specific to the dashboard page
    const welcomeMsg = document.getElementById('welcome-message');
    const dailyRitualInput = document.getElementById('daily-ritual');
    const activateAvatarBtn = document.getElementById('activate-avatar');
    const avatarEffect = document.getElementById('avatar-effect');
    const dailyInsight = document.getElementById('daily-insight');

    // Guard against elements not being found (though they should be if template is correct)
    if (!welcomeMsg || !dailyRitualInput || !activateAvatarBtn || !avatarEffect || !dailyInsight) {
        console.error("Dashboard elements not found. Cannot initialize.");
        return;
    }

    // Set welcome message with current date and time
    const now = new Date();
    welcomeMsg.textContent = `Welcome, Initiate. System Time: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    // Display a random insight from the predefined list
    dailyInsight.textContent = `"${DAILY_INSIGHTS[Math.floor(Math.random() * DAILY_INSIGHTS.length)]}"`;

    // Load the saved daily ritual text into the textarea
    dailyRitualInput.value = AppState.dailyRitual;
    // Add event listener to save changes to the ritual text in real-time
    dailyRitualInput.addEventListener('input', (e) => {
        AppState.dailyRitual = e.target.value;
        saveTextData('dailyRitual', AppState.dailyRitual); // Save as plain text
    });

    // Add click listener for the "Activate Avatar State" button effect
    activateAvatarBtn.addEventListener('click', () => {
        avatarEffect.style.width = '0%'; // Reset effect bar width
        // Force browser reflow to ensure the transition restarts correctly
        void avatarEffect.offsetWidth;
        avatarEffect.style.width = '100%'; // Animate width to 100%
        // Optional: Reset the effect bar after the animation duration
        setTimeout(() => { avatarEffect.style.width = '0%'; }, 1500); // Duration matches CSS transition
        // Play a sound effect associated with activation
        playSoundEffect('activate');
    });
}

function initMemoryLog() {
    // Get elements for the memory log page
    const entryInput = document.getElementById('memory-entry');
    const addBtn = document.getElementById('add-memory');
    const searchInput = document.getElementById('memory-search');
    const listContainer = document.getElementById('memory-list');

    if (!entryInput || !addBtn || !searchInput || !listContainer) {
        console.error("Memory Log elements not found. Cannot initialize.");
        return;
    }

    // Function to render the list of memories, optionally filtered
    function renderMemories(filter = '') {
        listContainer.innerHTML = ''; // Clear the current list display
        const lowerCaseFilter = filter.toLowerCase();

        // Filter memories based on the search term and sort by timestamp (newest first)
        const filteredMemories = AppState.memories
            .filter(mem => !filter || mem.text.toLowerCase().includes(lowerCaseFilter))
            .sort((a, b) => b.timestamp - a.timestamp);

        // Display a message if no memories match or exist
        if (filteredMemories.length === 0) {
            listContainer.innerHTML = `<p class="italic text-sm themed-text opacity-70">${filter ? 'No matching memories found.' : 'Record your first memory above.'}</p>`;
            return;
        }

        // Create and append HTML elements for each memory entry
        filteredMemories.forEach(mem => {
            const div = document.createElement('div');
            div.className = 'border themed-border p-3 rounded text-sm relative mb-3'; // Added relative positioning and margin
            const date = new Date(mem.timestamp).toLocaleString();
            // Find the original index in the AppState array for the delete button
            const originalIndex = AppState.memories.findIndex(m => m.timestamp === mem.timestamp);

            div.innerHTML = `
                <p class="font-jetbrains text-xs mb-1 themed-accent-text">${date}</p>
                <p class="whitespace-pre-wrap themed-text pr-10">${escapeHtml(mem.text)}</p> <button data-index="${originalIndex}" class="delete-memory-btn absolute top-2 right-2 text-xs themed-danger-text hover:underline p-1" title="Delete Memory">&times;</button> `;
            listContainer.appendChild(div);
        });

        // Re-attach event listeners to the newly created delete buttons
        listContainer.querySelectorAll('.delete-memory-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteMemory);
        });
    }

    // Function to handle adding a new memory entry
    function handleAddMemory() {
        const text = entryInput.value.trim();
        if (!text) return; // Ignore empty entries

        const newMemory = {
            text: text,
            timestamp: Date.now() // Use current timestamp as ID and for sorting
        };
        AppState.memories.push(newMemory); // Add to the runtime state array
        saveData('memories', AppState.memories); // Persist the updated array to localStorage
        entryInput.value = ''; // Clear the input field
        renderMemories(searchInput.value); // Re-render the list with the new entry
        playSoundEffect('log'); // Play a confirmation sound
    }

     // Function to handle deleting a memory entry
     function handleDeleteMemory(event) {
        const indexToDelete = parseInt(event.target.dataset.index, 10);
        // Validate the index retrieved from the button's data attribute
        if (isNaN(indexToDelete) || indexToDelete < 0 || indexToDelete >= AppState.memories.length) {
            console.error("Invalid index for memory deletion:", indexToDelete);
            return;
        }
        // Confirm deletion with the user
        if (confirm('Are you sure you want to permanently delete this memory?')) {
            AppState.memories.splice(indexToDelete, 1); // Remove the memory from the state array
            saveData('memories', AppState.memories); // Persist the changes
            renderMemories(searchInput.value); // Re-render the list
            playSoundEffect('delete'); // Play a deletion sound
        }
    }

    // Attach event listeners
    addBtn.addEventListener('click', handleAddMemory);
    // Update the displayed list whenever the search input changes
    searchInput.addEventListener('input', (e) => renderMemories(e.target.value));

    // Initial rendering of memories when the page loads
    renderMemories();
}


function initSkillTree() {
    // Get elements for the skill tree page
    const nameInput = document.getElementById('new-skill-name');
    const descInput = document.getElementById('new-skill-desc');
    const addBtn = document.getElementById('add-skill');
    const listContainer = document.getElementById('skill-list');

    if (!nameInput || !descInput || !addBtn || !listContainer) {
        console.error("Skill Tree elements not found. Cannot initialize.");
        return;
    }

    // Function to render the list of skills
    function renderSkills() {
        listContainer.innerHTML = ''; // Clear the current skill list
        // Display a message if no skills are defined
        if (AppState.skills.length === 0) {
            listContainer.innerHTML = '<p class="italic text-sm themed-text opacity-70">No skills defined yet. Add your first skill above.</p>';
            return;
        }

        // Create and append HTML for each skill
        AppState.skills.forEach((skill, index) => {
            const div = document.createElement('div');
            div.className = 'border themed-border p-3 rounded mb-3'; // Added margin-bottom
            // Apply accent color to name if skill is unlocked
            const nameColorClass = skill.unlocked ? 'themed-accent-text' : 'themed-text';
            div.innerHTML = `
                <div class="flex justify-between items-start mb-1 gap-4">
                    <h4 class="text-lg font-semibold font-jetbrains ${nameColorClass}">${escapeHtml(skill.name)}</h4>
                    <div class="flex items-center gap-3 flex-shrink-0"> <label class="text-xs flex items-center cursor-pointer themed-text whitespace-nowrap">
                            <input type="checkbox" data-index="${index}" class="toggle-skill-checkbox mr-1 accent-violet-500 themed-input" ${skill.unlocked ? 'checked' : ''}>
                            Unlocked
                        </label>
                        <button data-index="${index}" class="delete-skill-btn text-xs themed-danger-text hover:underline p-1" title="Delete Skill">&times;</button>
                    </div>
                </div>
                <p class="text-sm themed-text opacity-80">${escapeHtml(skill.description)}</p>
            `;
            listContainer.appendChild(div);
        });

         // Re-attach event listeners to checkboxes and delete buttons
        listContainer.querySelectorAll('.toggle-skill-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleToggleSkill);
        });
        listContainer.querySelectorAll('.delete-skill-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteSkill);
        });
    }

     // Function to handle adding a new skill
     function handleAddSkill() {
        const name = nameInput.value.trim();
        const description = descInput.value.trim();
        if (!name) { // Basic validation: ensure name is not empty
            alert("Please enter a name for the skill.");
            return;
        }

        const newSkill = {
            name: name,
            description: description,
            unlocked: false, // New skills start locked
            id: Date.now() // Use timestamp as a simple unique ID
        };
        AppState.skills.push(newSkill); // Add to state
        saveData('skills', AppState.skills); // Persist changes
        nameInput.value = ''; // Clear input fields
        descInput.value = '';
        renderSkills(); // Re-render the list
        playSoundEffect('add'); // Play sound effect
    }

     // Function to handle toggling the 'unlocked' status of a skill
     function handleToggleSkill(event) {
        const index = parseInt(event.target.dataset.index, 10);
        // Validate index
        if (index >= 0 && index < AppState.skills.length) {
            AppState.skills[index].unlocked = event.target.checked; // Update state
            saveData('skills', AppState.skills); // Persist changes
            renderSkills(); // Re-render to reflect visual changes (e.g., name color)
            playSoundEffect(event.target.checked ? 'unlock' : 'lock'); // Play appropriate sound
        }
    }

     // Function to handle deleting a skill
     function handleDeleteSkill(event) {
        const indexToDelete = parseInt(event.target.dataset.index, 10);
         // Validate index
         if (isNaN(indexToDelete) || indexToDelete < 0 || indexToDelete >= AppState.skills.length) {
            console.error("Invalid index for skill deletion:", indexToDelete);
            return;
        }
        // Confirm deletion with user
        if (confirm(`Are you sure you want to permanently delete the skill "${AppState.skills[indexToDelete].name}"?`)) {
            AppState.skills.splice(indexToDelete, 1); // Remove from state
            saveData('skills', AppState.skills); // Persist changes
            renderSkills(); // Re-render the list
            playSoundEffect('delete'); // Play sound effect
        }
    }

    // Attach event listener for the add skill button
    addBtn.addEventListener('click', handleAddSkill);

    // Initial rendering of the skill list when the page loads
    renderSkills();
}


function initSigilVault() {
    // Get elements for the sigil vault page
    const canvas = document.getElementById('sigil-canvas');
    const nameInput = document.getElementById('sigil-name');
    const saveBtn = document.getElementById('save-sigil');
    const clearBtn = document.getElementById('clear-canvas');
    const galleryContainer = document.getElementById('sigil-gallery');
    const simulateUploadBtn = document.getElementById('simulate-upload-sigil'); // Optional upload button

    if (!canvas || !nameInput || !saveBtn || !clearBtn || !galleryContainer) {
         console.error("Sigil Vault elements not found. Cannot initialize.");
         return;
    }

    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // Function to set canvas drawing styles based on current theme
    function setupCanvasStyle() {
        // Set drawing color (stroke) and background fill based on theme
        ctx.strokeStyle = AppState.theme === 'light' ? '#1a1a2e' : '#e0e0e0';
        ctx.fillStyle = AppState.theme === 'light' ? '#ffffff' : '#1a1a2e';
        ctx.lineWidth = 2; // Line thickness
        ctx.lineJoin = 'round'; // Smooth line joins
        ctx.lineCap = 'round'; // Rounded line ends
        // Clear the canvas by filling it with the current theme's background color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Function to handle drawing logic (called on mousemove/touchmove)
    function draw(e) {
        if (!isDrawing) return; // Only draw if mouse/touch is down

        // Calculate current pointer position relative to the canvas, accounting for scaling
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let currentX, currentY;

        // Determine coordinates based on event type (touch or mouse)
        if (e.touches && e.touches.length > 0) {
            currentX = (e.touches[0].clientX - rect.left) * scaleX;
            currentY = (e.touches[0].clientY - rect.top) * scaleY;
        } else {
            currentX = (e.clientX - rect.left) * scaleX;
            currentY = (e.clientY - rect.top) * scaleY;
        }

        // Draw a line from the last position to the current position
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // Update the last position for the next segment
        [lastX, lastY] = [currentX, currentY];
    }

    // Function called when drawing starts (mousedown/touchstart)
    function startDrawing(e) {
        isDrawing = true;
        // Record the starting position
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
         if (e.touches && e.touches.length > 0) {
            [lastX, lastY] = [(e.touches[0].clientX - rect.left) * scaleX, (e.touches[0].clientY - rect.top) * scaleY];
        } else {
            [lastX, lastY] = [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
        }
        // Prevent default touch behavior like scrolling while drawing
        if (e.touches) e.preventDefault();
    }

    // Function called when drawing stops (mouseup/touchend/mouseout/touchcancel)
    function stopDrawing() {
        if (isDrawing) {
            isDrawing = false;
            ctx.beginPath(); // End the current path to avoid connecting lines later
        }
    }

    // Function to clear the canvas back to the background color
    function clearCanvas() {
        setupCanvasStyle(); // Re-applies background fill and resets styles
        playSoundEffect('clear');
    }

    // Function to render the gallery of saved sigils
    function renderSigils() {
        galleryContainer.innerHTML = ''; // Clear existing gallery items
        // Display message if no sigils are saved
        if (AppState.sigils.length === 0) {
            galleryContainer.innerHTML = '<p class="italic text-sm col-span-full themed-text opacity-70">No sigils saved yet. Draw or upload one.</p>';
            return;
        }

        // Create and append HTML for each saved sigil
        AppState.sigils.forEach((sigil, index) => {
            const div = document.createElement('div');
            // Added relative positioning for the delete button
            div.className = 'border themed-border p-2 rounded text-center relative group'; // Added group for hover effect
            div.innerHTML = `
                <img src="${sigil.imageData}" alt="${escapeHtml(sigil.name)}" class="w-full h-auto object-contain mb-2 themed-bg border border-transparent group-hover:border-violet-500 transition-colors" style="max-height: 100px;">
                <p class="text-xs font-jetbrains truncate themed-text">${escapeHtml(sigil.name)}</p>
                <button data-index="${index}" class="delete-sigil-btn absolute top-1 right-1 text-xs themed-danger-text hover:underline p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Sigil">&times;</button>
            `;
            galleryContainer.appendChild(div);
        });

        // Re-attach event listeners to delete buttons
         galleryContainer.querySelectorAll('.delete-sigil-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteSigil);
        });
    }

    // Function to handle saving the current canvas drawing as a sigil
    function handleSaveSigil() {
        const name = nameInput.value.trim() || `Sigil_${Date.now()}`; // Default name if empty
        // Convert canvas content to a PNG data URL
        const imageData = canvas.toDataURL('image/png');

        // Optional: Add a more robust check for an empty canvas here if needed.
        // A simple check might compare the current dataURL to a freshly cleared canvas dataURL.

        const newSigil = {
            name: name,
            imageData: imageData,
            timestamp: Date.now()
        };
        AppState.sigils.push(newSigil); // Add to state
        saveData('sigils', AppState.sigils); // Persist changes
        nameInput.value = ''; // Clear the name input
        clearCanvas(); // Clear the canvas
        renderSigils(); // Update the gallery display
        playSoundEffect('save'); // Play sound effect
    }

     // Function to handle deleting a sigil from the gallery
     function handleDeleteSigil(event) {
        const indexToDelete = parseInt(event.target.dataset.index, 10);
        // Validate index
        if (isNaN(indexToDelete) || indexToDelete < 0 || indexToDelete >= AppState.sigils.length) {
            console.error("Invalid index for sigil deletion:", indexToDelete);
            return;
        }
        // Confirm deletion
        if (confirm(`Are you sure you want to permanently delete the sigil "${AppState.sigils[indexToDelete].name}"?`)) {
            AppState.sigils.splice(indexToDelete, 1); // Remove from state
            saveData('sigils', AppState.sigils); // Persist changes
            renderSigils(); // Update gallery display
            playSoundEffect('delete'); // Play sound effect
        }
    }

    // Attach Event Listeners for Drawing
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing); // Stop drawing if mouse leaves canvas

    // Attach Touch Event Listeners
    canvas.addEventListener('touchstart', startDrawing, { passive: false }); // passive: false to allow preventDefault
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    // Attach Button Listeners
    saveBtn.addEventListener('click', handleSaveSigil);
    clearBtn.addEventListener('click', clearCanvas);
    // Note: Simulate upload button is currently disabled via CSS/HTML

    // Initial setup when page loads
    setupCanvasStyle(); // Set initial canvas colors based on theme
    renderSigils(); // Render any previously saved sigils
}


// --- Red Gate Mode ---
let ambientSynth = null; // Variable to hold the Tone.js synth instance

function initRedGate() {
     // Get elements for the Red Gate page
     const mantraInput = document.getElementById('red-gate-mantra-input');
     const activateBtn = document.getElementById('activate-red-gate');

     if (!mantraInput || !activateBtn) {
         console.error("Red Gate elements not found. Cannot initialize.");
         return;
     }

     // Load the saved mantra into the input field
     mantraInput.value = AppState.redGateMantra;

     // Add listener to save the mantra whenever the input changes
     mantraInput.addEventListener('input', (e) => {
         AppState.redGateMantra = e.target.value || 'Be Present. Be Calm.'; // Use default if cleared
         saveTextData('redGateMantra', AppState.redGateMantra); // Save as plain text
     });

     // Add listener to the activate button
     activateBtn.addEventListener('click', () => {
         // Check if Tone.js library is available
         if (typeof Tone === 'undefined' || !Tone.start) {
             alert("Audio library (Tone.js) could not be loaded. Visual mode only.");
             showRedGateOverlay(); // Show overlay even without sound
             return;
         }

         // Attempt to start Tone.js audio context (required by browsers)
         Tone.start().then(() => {
             // Once context is started, play sound and show overlay
             startRedGateAudio();
             showRedGateOverlay();
         }).catch(error => {
             console.error("Tone.js context start failed:", error);
             alert("Could not start audio context. Please interact with the page first. Visual mode only.");
             showRedGateOverlay(); // Still show overlay
         });
     });
}

// Function to display the Red Gate overlay
function showRedGateOverlay() {
    // Set the mantra text in the overlay
    redGateMantraDisplay.textContent = AppState.redGateMantra;
    // Make the overlay visible
    redGateOverlay.classList.add('active');
    // Attach the exit listener directly to the button when overlay is shown
    redGateExitButton.onclick = hideRedGateOverlay;
}

// Function to hide the Red Gate overlay
function hideRedGateOverlay() {
    // Make the overlay invisible
    redGateOverlay.classList.remove('active');
    // Stop the ambient audio
    stopRedGateAudio();
    // Remove the listener from the exit button to prevent memory leaks
    redGateExitButton.onclick = null;
}

// Function to start the ambient audio using Tone.js
function startRedGateAudio() {
    if (typeof Tone === 'undefined') return; // Guard again

    // Stop any previously playing synth instance
    stopRedGateAudio();

    // Create a new ambient synth sound
    // Using MonoSynth with slow attack/release and filter envelope for a drone-like effect
    ambientSynth = new Tone.MonoSynth({
        oscillator: { type: 'sine' }, // Soft sine wave base
        envelope: { attack: 4, decay: 1, sustain: 0.4, release: 4 }, // Slow fades
        filterEnvelope: { attack: 6, decay: 0.2, sustain: 0.5, release: 6, baseFrequency: 200, octaves: 3 } // Filter sweep
    }).toDestination(); // Connect synth output to audio output

    // Use Tone.Loop to play a note repeatedly, creating a continuous sound
     const loop = new Tone.Loop(time => {
        // Trigger the synth note (low C, lasts for 8 seconds) at the scheduled time
        ambientSynth.triggerAttackRelease("C2", "8n", time);
        // Slightly modulate the filter frequency for subtle variation
        ambientSynth.filterEnvelope.baseFrequency = 150 + Math.random() * 100;
    }, "4n"); // Schedule the loop to run every 4 seconds

    loop.start(0); // Start the loop immediately
    Tone.Transport.start(); // Start Tone's master transport clock

    // Store the loop reference so we can stop it later
    ambientSynth.loopRef = loop;
}

// Function to stop the ambient audio
function stopRedGateAudio() {
     if (typeof Tone === 'undefined') return; // Guard

    if (ambientSynth) {
        // If a loop was created, stop and dispose of it
        if (ambientSynth.loopRef && typeof ambientSynth.loopRef.dispose === 'function') {
            ambientSynth.loopRef.stop(0);
            ambientSynth.loopRef.dispose();
            ambientSynth.loopRef = null; // Clear reference
        }
        // Trigger the synth's release phase to fade out
        ambientSynth.triggerRelease();

        // Schedule disposal of the synth object after its release phase completes
        // Use the synth's release time, default to 4s if not defined
        const releaseTime = (ambientSynth.envelope?.release || 4) * 1000;
        setTimeout(() => {
            if (ambientSynth && typeof ambientSynth.dispose === 'function') {
                 ambientSynth.dispose();
            }
             ambientSynth = null; // Clear the synth variable
        }, releaseTime + 100); // Add small buffer

        // Optionally stop the main transport if nothing else uses it
        // Consider if other sounds might need the transport running
        // Tone.Transport.stop();
    }
}


// --- Settings ---
function initSettings() {
    // Get elements for the settings page
    const toggleThemeBtn = document.getElementById('toggle-theme');
    const exportBtn = document.getElementById('export-data');
    const importInput = document.getElementById('import-data'); // The file input element
    const importLabel = importInput.parentElement; // The label acting as the button
    const clearDataBtn = document.getElementById('clear-data');

    if (!toggleThemeBtn || !exportBtn || !importInput || !clearDataBtn || !importLabel) {
        console.error("Settings elements not found. Cannot initialize.");
        return;
    }

    // Attach event listeners
    toggleThemeBtn.addEventListener('click', toggleTheme);
    exportBtn.addEventListener('click', exportData);
    // Listen for changes on the hidden file input
    importInput.addEventListener('change', handleImportData);
    clearDataBtn.addEventListener('click', clearAllData);
}

// Function to export all relevant app data as a JSON file
function exportData() {
    const dataToExport = {};
    // Define the keys in AppState that should be included in the export
    const keysToExport = ['theme', 'dailyRitual', 'memories', 'skills', 'sigils', 'redGateMantra'];

    // Retrieve data directly from localStorage for accuracy
    keysToExport.forEach(key => {
        const storageKey = `aethelos_${key}`;
        const storedValue = localStorage.getItem(storageKey);
        if (storedValue !== null) {
             // Attempt to parse if it's likely JSON (memories, skills, sigils)
             if (['memories', 'skills', 'sigils'].includes(key)) {
                 try {
                     dataToExport[key] = JSON.parse(storedValue);
                 } catch (e) {
                     console.warn(`Could not parse ${key} from localStorage during export. Skipping.`);
                 }
             } else {
                 // Store plain text values directly (theme, ritual, mantra)
                 dataToExport[key] = storedValue;
             }
        }
    });

    // Check if there's actually data to export
    if (Object.keys(dataToExport).length === 0) {
        alert("No data found in localStorage to export.");
        return;
    }

    // Convert the data object to a formatted JSON string
    const jsonString = JSON.stringify(dataToExport, null, 2); // Pretty print with 2-space indent
    // Create a Blob object containing the JSON data
    const blob = new Blob([jsonString], { type: 'application/json' });
    // Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    // Suggest a filename for the download
    a.download = `aethelos_os_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); // Append to DOM to make it clickable
    a.click(); // Simulate click to trigger download
    document.body.removeChild(a); // Clean up the temporary anchor
    URL.revokeObjectURL(url); // Release the object URL
    playSoundEffect('export'); // Play confirmation sound
}

// Function to handle importing data from a selected JSON file
function handleImportData(event) {
    const file = event.target.files[0]; // Get the selected file
    if (!file) return; // Exit if no file was selected

    // Use FileReader to read the file content
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // Parse the file content as JSON
            const importedData = JSON.parse(e.target.result);

            // Double-confirm with the user before overwriting existing data
            if (confirm("WARNING: Importing data will overwrite all current settings, rituals, memories, skills, and sigils. Are you sure you want to proceed?")) {

                // Clear existing relevant state in localStorage before importing
                const keysToImport = ['theme', 'dailyRitual', 'memories', 'skills', 'sigils', 'redGateMantra'];
                keysToImport.forEach(key => localStorage.removeItem(`aethelos_${key}`));

                // Import and save each piece of data found in the file
                let importedTheme = AppState.theme; // Keep track of imported theme
                Object.keys(importedData).forEach(key => {
                    // Only import keys relevant to the app
                    if (keysToImport.includes(key)) {
                        const storageKey = `aethelos_${key}`;
                        const value = importedData[key];

                        if (value !== undefined && value !== null) {
                            // Store objects/arrays as JSON strings, others as plain text
                            if (typeof value === 'object') {
                                localStorage.setItem(storageKey, JSON.stringify(value));
                            } else {
                                localStorage.setItem(storageKey, value.toString());
                            }
                            // Keep track of the theme specifically for applying it later
                            if (key === 'theme') {
                                importedTheme = value.toString();
                            }
                        }
                    }
                });

                // Apply the imported theme immediately
                applyTheme(importedTheme);

                alert("Data imported successfully! The application will now reload to apply all changes.");
                // Force a reload to ensure all components update with the new data
                 location.reload();
            }
        } catch (err) {
            console.error("Error importing data:", err);
            alert("Import failed. Please ensure the selected file is a valid JSON backup created by this application.");
        } finally {
             // Reset the file input value to allow importing the same file again if needed
             event.target.value = null;
        }
    };
    // Read the file as text
    reader.readAsText(file);
}


// Function to clear all application data from localStorage
function clearAllData() {
    // Triple confirmation for safety
    if (confirm("WARNING: This will permanently delete ALL your saved data (rituals, memories, skills, sigils, settings) from this browser. This action cannot be undone. Are you absolutely sure?")) {
        if (confirm("FINAL CONFIRMATION: Really delete everything?")) {
            // Iterate through all localStorage keys and remove those used by this app
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('aethelos_')) {
                    localStorage.removeItem(key);
                }
            });

            // Reset the runtime AppState object to defaults (optional, as reload will handle this)
            // AppState.currentPage = 'dashboard';
            // AppState.theme = 'dark';
            // AppState.dailyRitual = '';
            // AppState.memories = [];
            // AppState.skills = [];
            // AppState.sigils = [];
            // AppState.redGateMantra = 'Be Present. Be Calm.';

            alert("All application data has been cleared. Reloading application.");
            playSoundEffect('delete'); // Play deletion sound
            // Reload the application to reflect the cleared state
             location.reload();
        }
    }
}

// --- Sound Effects (using Tone.js) ---
// Plays short audio cues for different actions
function playSoundEffect(type) {
    // Check if Tone.js is loaded
    if (typeof Tone === 'undefined' || !Tone.start) {
        console.warn("Tone.js not available, cannot play sound effect:", type);
        return;
    }

    // Ensure Tone.js audio context is started (required by browsers)
    Tone.start().then(() => {
        let synth; // Synth instance for the sound effect
        let duration = 200; // Default duration for disposal timer

        try {
            // Create different synth sounds based on the action type
            switch (type) {
                case 'activate':
                    synth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.2 } }).toDestination();
                    synth.triggerAttackRelease("C5", "8n");
                    duration = (0.01 + 0.1 + 0.2) * 1000 + 50;
                    break;
                case 'log':
                case 'add':
                    // Short double beep
                    synth = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 } }).toDestination();
                    synth.triggerAttackRelease("E4", "16n", Tone.now());
                    synth.triggerAttackRelease("G4", "16n", Tone.now() + 0.05);
                    duration = (0.005 + 0.1 + 0.1) * 1000 + 50 + 50; // Account for second note delay
                    break;
                 case 'save':
                    // Simple confirmation tone
                    synth = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 } }).toDestination();
                    synth.triggerAttackRelease("A4", "8n");
                    duration = (0.01 + 0.2 + 0.2) * 1000 + 50;
                    break;
                case 'delete':
                case 'clear':
                    // Short noise burst
                    synth = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 } }).toDestination();
                    synth.triggerAttackRelease("16n");
                    duration = (0.001 + 0.05 + 0.05) * 1000 + 50;
                    break;
                case 'unlock':
                    // Ascending, brighter tone
                    synth = new Tone.Synth({ oscillator: { type: 'pwm', modulationFrequency: 0.2 }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.3 } }).toDestination();
                    synth.triggerAttackRelease("G5", "8n");
                    duration = (0.01 + 0.3 + 0.3) * 1000 + 50;
                    break;
                 case 'lock':
                    // Lower, duller tone
                    synth = new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 } }).toDestination();
                    synth.triggerAttackRelease("D3", "16n");
                    duration = (0.01 + 0.1 + 0.1) * 1000 + 50;
                    break;
                case 'export':
                    // Simple arpeggio for export confirmation
                    synth = new Tone.FMSynth({ envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 0.5 } }).toDestination();
                    synth.triggerAttackRelease("C4", "4n", Tone.now());
                    synth.triggerAttackRelease("G4", "4n", Tone.now() + 0.2);
                    synth.triggerAttackRelease("C5", "4n", Tone.now() + 0.4);
                    duration = (0.01 + 0.5 + 0.5) * 1000 + 50 + 400; // Account for last note start time
                    break;
                 default:
                    console.warn("Unknown sound effect type:", type);
                    return; // No sound for unknown type
            }

             // Auto-dispose the synth after the sound finishes to free resources
            if (synth && typeof synth.dispose === 'function') {
                setTimeout(() => {
                    synth.dispose();
                }, duration);
            }

        } catch (err) {
            console.error("Tone.js sound effect error:", err);
            // Clean up synth if creation failed mid-way
            if (synth && typeof synth.dispose === 'function') {
                 synth.dispose();
            }
        }
    }).catch(error => {
        console.error("Tone.js context start failed for sound effect:", error);
    });
}


// --- Utility Functions ---
// Simple HTML escaping function to prevent XSS issues when displaying user input
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe; // Only escape strings
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// --- Initialization ---
// Main function to set up the application when the DOM is ready
function initApp() {
    // Apply the stored or default theme on initial load
    applyTheme(AppState.theme);

    // Set up navigation link click handlers
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor link behavior
            const pageId = link.getAttribute('href').substring(1); // Extract page ID from href
            loadPage(pageId); // Load the corresponding page
            // Update the URL hash to reflect the current page (allows bookmarking/history)
            window.location.hash = pageId;
        });
    });

     // Handle initial page load based on the URL hash, or default to dashboard
    const initialPage = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
    // Validate that a template exists for the initial page before loading
    if (document.getElementById(`page-${initialPage}`)) {
         loadPage(initialPage);
    } else {
         console.warn(`Initial hash "#${initialPage}" does not match any page template. Loading dashboard.`);
         loadPage('dashboard'); // Fallback to dashboard if hash is invalid
         window.location.hash = 'dashboard'; // Correct the hash
    }

    // Register the PWA service worker
    registerServiceWorker();

    // Add optional keyboard shortcuts
    document.addEventListener('keydown', (e) => {
         // Shortcut: Press 'r' (lowercase) to activate Red Gate mode
         // Avoid triggering if user is typing in an input field
         if (e.key === 'r' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault(); // Prevent typing 'r' if not in input
              loadPage('red-gate');
              // Optionally auto-activate the mode after loading the page
               requestIdleCallback(() => { // Wait until browser is idle
                    const activateBtn = document.getElementById('activate-red-gate');
                    if (activateBtn) activateBtn.click();
               });
         }
         // Add other shortcuts here (e.g., 'd' for dashboard, 'm' for memory log)
         // if (e.key === 'd' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
         //      e.preventDefault(); loadPage('dashboard'); window.location.hash = 'dashboard';
         // }
         // if (e.key === 'm' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
         //      e.preventDefault(); loadPage('memory-log'); window.location.hash = 'memory-log';
         // }
    });

    // Hide the loading overlay once the app is minimally ready
    // Use requestIdleCallback to do this during browser idle time
    requestIdleCallback(() => {
         setTimeout(() => { // Add a small artificial delay for perceived loading
            loadingOverlay.classList.add('hidden');
         }, 300);
    });

     console.log("Aethel OS Initialized and Ready.");
}

// --- Global Event Listeners ---
// Handle browser back/forward navigation using hash changes
window.addEventListener('hashchange', () => {
    const pageId = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
    // Load the page corresponding to the new hash if it's different from the current page
    if (pageId !== AppState.currentPage) {
         // Validate that a template exists before loading
         if (document.getElementById(`page-${pageId}`)) {
             loadPage(pageId);
         } else {
              console.warn(`Hash changed to "#${pageId}", but no matching template found. Returning to dashboard.`);
              loadPage('dashboard');
              window.location.hash = 'dashboard'; // Correct the hash
         }
    }
});

// Start the application initialization process once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);
