// ============================================
// Marathi Word Learning Game
// With Spaced Repetition & Gamification
// ============================================

// ============ CONFIGURATION ============
const CONFIG = {
    WORDS_PER_SESSION: 10,
    NEW_WORDS_PER_SESSION: 3,
    REWARD_INTERVAL_MIN: 3,
    REWARD_INTERVAL_MAX: 5,
    STARS_FOR_CANDY: 15,
    REPEAT_QUEUE_DELAY: 3  // Show wrong words again after N other words
};

// ============ REWARD IMAGES ============
const REWARD_IMAGES = [
    'data/images/dadukli.png',
    'data/images/tukkal.png'
];

// ============ ANIMAL REWARDS ============
const ANIMALS = [
    { emoji: '🦁', name: 'Lion' },
    { emoji: '🐘', name: 'Elephant' },
    { emoji: '🦒', name: 'Giraffe' },
    { emoji: '🐯', name: 'Tiger' },
    { emoji: '🦊', name: 'Fox' },
    { emoji: '🐼', name: 'Panda' },
    { emoji: '🐨', name: 'Koala' },
    { emoji: '🦋', name: 'Butterfly' },
    { emoji: '🦜', name: 'Parrot' },
    { emoji: '🐬', name: 'Dolphin' },
    { emoji: '🦩', name: 'Flamingo' },
    { emoji: '🦄', name: 'Unicorn' },
    { emoji: '🐙', name: 'Octopus' },
    { emoji: '🦀', name: 'Crab' },
    { emoji: '🐢', name: 'Turtle' },
    { emoji: '🦔', name: 'Hedgehog' },
    { emoji: '🐝', name: 'Bee' },
    { emoji: '🦚', name: 'Peacock' },
    { emoji: '🐸', name: 'Frog' },
    { emoji: '🦧', name: 'Orangutan' },
    { emoji: '🐰', name: 'Rabbit' },
    { emoji: '🦉', name: 'Owl' },
    { emoji: '🐳', name: 'Whale' },
    { emoji: '🦈', name: 'Shark' }
];

const CONGRATULATIONS = [
    { marathi: 'शाब्बास!', english: "You're amazing!" },
    { marathi: 'छान!', english: 'Great job!' },
    { marathi: 'अप्रतिम!', english: 'Excellent work!' },
    { marathi: 'वाह!', english: 'Wonderful!' },
    { marathi: 'खूप छान!', english: 'Very good!' },
    { marathi: 'बरोबर!', english: 'Keep it up!' },
    { marathi: 'मस्त!', english: "You're a star!" },
    { marathi: 'जबरदस्त!', english: 'Fantastic!' }
];

// ============ GAME STATE ============
let gameState = {
    currentLetter: null,
    words: [],
    wordProgress: {},  // Spaced repetition data per word
    sessionQueue: [],
    currentWordIndex: 0,
    sessionStats: {
        correct: 0,
        incorrect: 0,
        streak: 0,
        bestStreak: 0
    },
    correctSinceLastReward: 0,
    nextRewardAt: 0,
    usedAnimalsThisSession: []
};

// ============ DOM ELEMENTS ============
const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    reward: document.getElementById('reward-screen'),
    complete: document.getElementById('complete-screen'),
    stats: document.getElementById('stats-screen')
};

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async () => {
    await initializeGame();
    setupEventListeners();
});

async function initializeGame() {
    // Load available letter CSV files
    const availableLetters = await findAvailableLetters();
    renderLetterButtons(availableLetters);

    // Load saved progress from localStorage
    loadProgress();
}

async function findAvailableLetters() {
    // Generate all possible Marathi letter combinations programmatically
    const consonants = [
        'क', 'ख', 'ग', 'घ', 'च', 'छ', 'ज', 'झ', 'ट', 'ठ',
        'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ',
        'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह'
    ];
    const vowels = ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ'];
    const matras = ['ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ', 'ं'];

    const marathiLetters = [];

    // Add vowels
    marathiLetters.push(...vowels);

    // Add consonants (plain)
    marathiLetters.push(...consonants);

    // Add all consonant + matra combinations
    for (const consonant of consonants) {
        for (const matra of matras) {
            marathiLetters.push(consonant + matra);
        }
    }

    const available = [];

    // Try to fetch each CSV file to see which ones exist
    for (const letter of marathiLetters) {
        try {
            const response = await fetch(`data/${letter}.csv`);
            if (response.ok) {
                available.push(letter);
            }
        } catch (e) {
            // File doesn't exist, skip
        }
    }

    return available.length > 0 ? available : ['म']; // Default to म if none found
}

function renderLetterButtons(letters) {
    const container = document.getElementById('letter-buttons');
    container.innerHTML = '';

    // Define the order of matras for consistent column ordering
    const matraOrder = ['', 'ा', 'ि', 'ी', 'ु', 'े', 'ो', 'ं'];

    // Group letters by base consonant
    const consonantGroups = {};
    const consonantOrder = [];

    letters.forEach(letter => {
        // Get the base consonant (first character)
        const base = letter.charAt(0);

        if (!consonantGroups[base]) {
            consonantGroups[base] = new Set();
            consonantOrder.push(base);
        }
        consonantGroups[base].add(letter);
    });

    // Create table
    const table = document.createElement('table');
    table.className = 'letter-table';

    // Render each consonant group as a row
    consonantOrder.forEach(base => {
        const tr = document.createElement('tr');

        // Add buttons in matra order
        matraOrder.forEach(matra => {
            const td = document.createElement('td');
            const letter = base + matra;
            const btn = document.createElement('button');
            btn.className = 'letter-btn';
            btn.textContent = letter;

            if (consonantGroups[base].has(letter)) {
                btn.addEventListener('click', () => selectLetter(letter));
            } else {
                btn.disabled = true;
                btn.classList.add('letter-btn-disabled');
            }

            td.appendChild(btn);
            tr.appendChild(td);
        });

        table.appendChild(tr);
    });

    container.appendChild(table);
}

function selectLetter(letter) {
    // Update selection UI
    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === letter);
    });

    gameState.currentLetter = letter;
    document.getElementById('start-btn').disabled = false;
}

function setupEventListeners() {
    // Start screen
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('stats-btn').addEventListener('click', () => showScreen('stats'));

    // Game screen
    document.getElementById('correct-btn').addEventListener('click', () => handleAnswer(true));
    document.getElementById('wrong-btn').addEventListener('click', () => handleAnswer(false));
    document.getElementById('hint-toggle').addEventListener('click', toggleHint);

    // Reward screen
    document.getElementById('continue-btn').addEventListener('click', continueAfterReward);

    // Complete screen
    document.getElementById('play-again-btn').addEventListener('click', startGame);
    document.getElementById('home-btn').addEventListener('click', () => showScreen('start'));

    // Stats screen
    document.getElementById('back-btn').addEventListener('click', () => showScreen('start'));
    document.getElementById('reset-candy-btn').addEventListener('click', resetCandyProgress);
    document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
}

// ============ SCREEN MANAGEMENT ============
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');

    if (screenName === 'stats') {
        updateStatsScreen();
    }
}

// ============ CSV LOADING ============
async function loadWordsFromCSV(letter) {
    try {
        const response = await fetch(`data/${letter}.csv`);
        const text = await response.text();
        return parseCSV(text);
    } catch (e) {
        console.error('Error loading CSV:', e);
        return [];
    }
}

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const words = [];

    // Detect format from header row
    const header = lines[0].toLowerCase();
    const hasSpelling = header.includes('spelling');

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');

        if (hasSpelling && parts.length >= 3) {
            // 3-column format: Word, Spelling, Meaning
            words.push({
                word: parts[0].trim(),
                spelling: parts[1].trim(),
                meaning: parts[2].trim()
            });
        } else if (parts.length >= 2) {
            // 2-column format: Word, Meaning (no spelling)
            words.push({
                word: parts[0].trim(),
                spelling: '',  // No spelling available
                meaning: parts[1].trim()
            });
        }
    }

    return words;
}

// ============ SPACED REPETITION ============
function getWordProgress(word) {
    const key = `${gameState.currentLetter}_${word}`;
    if (!gameState.wordProgress[key]) {
        gameState.wordProgress[key] = {
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
            nextReview: new Date().toISOString().split('T')[0],
            lastResult: null
        };
    }
    return gameState.wordProgress[key];
}

function updateWordProgress(word, correct) {
    const progress = getWordProgress(word);
    const today = new Date();

    if (correct) {
        if (progress.repetitions === 0) {
            progress.interval = 1;
        } else if (progress.repetitions === 1) {
            progress.interval = 3;
        } else {
            progress.interval = Math.round(progress.interval * progress.easeFactor);
        }
        progress.easeFactor = Math.min(2.5, progress.easeFactor + 0.1);
        progress.repetitions++;
        progress.lastResult = 'correct';
    } else {
        progress.repetitions = 0;
        progress.interval = 1;
        progress.easeFactor = Math.max(1.3, progress.easeFactor - 0.2);
        progress.lastResult = 'incorrect';
    }

    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + progress.interval);
    progress.nextReview = nextDate.toISOString().split('T')[0];

    saveProgress();
}

function buildSessionQueue() {
    const today = new Date().toISOString().split('T')[0];
    const queue = [];

    // Get words due for review
    const dueWords = gameState.words.filter(w => {
        const progress = getWordProgress(w.word);
        return progress.nextReview <= today;
    });

    // Get new words (never reviewed)
    const newWords = gameState.words.filter(w => {
        const progress = getWordProgress(w.word);
        return progress.repetitions === 0 && progress.lastResult === null;
    });

    // Shuffle both arrays
    shuffleArray(dueWords);
    shuffleArray(newWords);

    // Add due words first
    queue.push(...dueWords);

    // Add some new words
    const newWordsToAdd = newWords.slice(0, CONFIG.NEW_WORDS_PER_SESSION);
    queue.push(...newWordsToAdd);

    // Shuffle the final queue
    shuffleArray(queue);

    // Limit session size
    return queue.slice(0, CONFIG.WORDS_PER_SESSION);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ============ GAME FLOW ============
async function startGame() {
    if (!gameState.currentLetter) return;

    // Load words for selected letter
    gameState.words = await loadWordsFromCSV(gameState.currentLetter);

    if (gameState.words.length === 0) {
        alert('No words found for this letter!');
        return;
    }

    // Reset session stats
    gameState.sessionStats = {
        correct: 0,
        incorrect: 0,
        streak: 0,
        bestStreak: 0
    };
    gameState.correctSinceLastReward = 0;
    gameState.nextRewardAt = randomInt(CONFIG.REWARD_INTERVAL_MIN, CONFIG.REWARD_INTERVAL_MAX);
    gameState.usedAnimalsThisSession = [];
    gameState.currentWordIndex = 0;

    // Build session queue
    gameState.sessionQueue = buildSessionQueue();

    if (gameState.sessionQueue.length === 0) {
        alert('No words to practice today! Come back tomorrow.');
        return;
    }

    showScreen('game');
    displayCurrentWord();
    updateSessionProgress();
    updateStarsDisplay();
}

function displayCurrentWord() {
    const wordData = gameState.sessionQueue[gameState.currentWordIndex];
    const word = wordData.word;

    // Split word into grapheme clusters (handles Marathi combining characters properly)
    const graphemes = splitIntoGraphemes(word);
    const firstGrapheme = graphemes[0] || '';
    const restGraphemes = graphemes.slice(1).join('');

    document.getElementById('first-letter').textContent = firstGrapheme;
    document.getElementById('rest-letters').textContent = restGraphemes;
    document.getElementById('spelling').textContent = wordData.spelling;
    document.getElementById('meaning').textContent = wordData.meaning;

    // Show/hide spelling row based on whether spelling exists
    const spellingRow = document.getElementById('spelling').parentElement;
    spellingRow.style.display = wordData.spelling ? 'block' : 'none';

    // Hide hint
    document.getElementById('hint-content').classList.add('hidden');
    document.getElementById('hint-toggle').textContent = 'Show Hint 👁️';
}

// Split text into grapheme clusters (visible characters)
// Handles Devanagari combining marks (matras, nuktas, etc.)
function splitIntoGraphemes(text) {
    // Use Intl.Segmenter if available (modern browsers)
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter('mr', { granularity: 'grapheme' });
        return [...segmenter.segment(text)].map(s => s.segment);
    }

    // Fallback: regex pattern for Devanagari grapheme clusters
    // Matches a base character followed by any combining marks
    const devanagariPattern = /[\u0900-\u097F][\u0900-\u097F\u200C\u200D]*/g;
    const matches = text.match(devanagariPattern);
    return matches || [...text];
}

function toggleHint() {
    const hintContent = document.getElementById('hint-content');
    const hintBtn = document.getElementById('hint-toggle');

    if (hintContent.classList.contains('hidden')) {
        hintContent.classList.remove('hidden');
        hintBtn.textContent = 'Hide Hint 🙈';
    } else {
        hintContent.classList.add('hidden');
        hintBtn.textContent = 'Show Hint 👁️';
    }
}

function handleAnswer(correct) {
    const currentWord = gameState.sessionQueue[gameState.currentWordIndex];

    // Update spaced repetition data
    updateWordProgress(currentWord.word, correct);

    // Update session stats
    if (correct) {
        gameState.sessionStats.correct++;
        gameState.sessionStats.streak++;
        gameState.sessionStats.bestStreak = Math.max(
            gameState.sessionStats.bestStreak,
            gameState.sessionStats.streak
        );
        gameState.correctSinceLastReward++;
    } else {
        gameState.sessionStats.incorrect++;
        gameState.sessionStats.streak = 0;

        // Add word back to queue (after a few other words)
        const insertAt = Math.min(
            gameState.currentWordIndex + CONFIG.REPEAT_QUEUE_DELAY + 1,
            gameState.sessionQueue.length
        );
        gameState.sessionQueue.splice(insertAt, 0, currentWord);
    }

    updateStreakDisplay();

    // Check for reward
    if (correct && gameState.correctSinceLastReward >= gameState.nextRewardAt) {
        showReward();
        return;
    }

    // Move to next word or end session
    nextWord();
}

function nextWord() {
    gameState.currentWordIndex++;

    if (gameState.currentWordIndex >= gameState.sessionQueue.length) {
        endSession();
    } else {
        displayCurrentWord();
        updateSessionProgress();
        updateStarsDisplay();
    }
}

function updateSessionProgress() {
    const current = gameState.currentWordIndex + 1;
    const total = gameState.sessionQueue.length;
    document.getElementById('session-progress').textContent = `${current} / ${total}`;
}

function updateStreakDisplay() {
    document.getElementById('streak-count').textContent = gameState.sessionStats.streak;
}

function updateStarsDisplay() {
    const accuracy = calculateAccuracy();
    const stars = calculateStars(accuracy);

    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
        starsHtml += i < stars ? '⭐' : '☆';
    }
    document.getElementById('stars-display').textContent = starsHtml;
}

function calculateAccuracy() {
    const total = gameState.sessionStats.correct + gameState.sessionStats.incorrect;
    return total > 0 ? (gameState.sessionStats.correct / total) * 100 : 100;
}

function calculateStars(accuracy) {
    if (accuracy >= 95) return 5;
    if (accuracy >= 85) return 4;
    if (accuracy >= 70) return 3;
    if (accuracy >= 50) return 2;
    return 1;
}

// ============ REWARDS ============
function showReward() {
    // Pick a random image
    const randomImage = REWARD_IMAGES[randomInt(0, REWARD_IMAGES.length - 1)];

    // Pick a random animal not used this session
    const availableAnimals = ANIMALS.filter((_, i) => !gameState.usedAnimalsThisSession.includes(i));

    let animalIndex;
    if (availableAnimals.length === 0) {
        gameState.usedAnimalsThisSession = [];
        animalIndex = randomInt(0, ANIMALS.length - 1);
    } else {
        animalIndex = ANIMALS.indexOf(availableAnimals[randomInt(0, availableAnimals.length - 1)]);
    }

    gameState.usedAnimalsThisSession.push(animalIndex);
    const animal = ANIMALS[animalIndex];

    // 50% chance to show poop emoji alongside the animal
    const showPoop = Math.random() < 0.5;
    const emojiDisplay = showPoop ? animal.emoji + '💩' : animal.emoji;

    // Pick random congratulation
    const congrats = CONGRATULATIONS[randomInt(0, CONGRATULATIONS.length - 1)];

    // Show image + emoji
    const rewardContainer = document.getElementById('reward-animal');
    rewardContainer.innerHTML = `
        <img src="${randomImage}" alt="Reward" class="reward-image">
        <div class="reward-emoji">${emojiDisplay}</div>
    `;

    document.getElementById('reward-message').textContent = congrats.marathi;
    document.getElementById('reward-submessage').textContent = congrats.english;

    // Reset reward counter
    gameState.correctSinceLastReward = 0;
    gameState.nextRewardAt = randomInt(CONFIG.REWARD_INTERVAL_MIN, CONFIG.REWARD_INTERVAL_MAX);

    // Show confetti
    createConfetti();

    showScreen('reward');
}

function continueAfterReward() {
    showScreen('game');
    nextWord();
}

function createConfetti() {
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${randomInt(0, 100)}%`;
        confetti.style.background = colors[randomInt(0, colors.length - 1)];
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        confetti.style.width = `${randomInt(8, 15)}px`;
        confetti.style.height = `${randomInt(8, 15)}px`;

        document.body.appendChild(confetti);

        // Remove after animation
        setTimeout(() => confetti.remove(), 3000);
    }
}

// ============ SESSION END ============
function endSession() {
    const accuracy = calculateAccuracy();
    const stars = calculateStars(accuracy);

    // Update UI
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
        starsHtml += i < stars ? '⭐' : '☆';
    }
    document.getElementById('final-stars').textContent = starsHtml;
    document.getElementById('stars-label').textContent = `${stars} Star${stars !== 1 ? 's' : ''}!`;

    document.getElementById('final-correct').textContent = gameState.sessionStats.correct;
    document.getElementById('final-incorrect').textContent = gameState.sessionStats.incorrect;
    document.getElementById('final-accuracy').textContent = `${Math.round(accuracy)}%`;
    document.getElementById('final-streak').textContent = gameState.sessionStats.bestStreak;
    document.getElementById('words-practiced').textContent = gameState.sessionQueue.length;

    // Save session to history
    saveSession(stars, accuracy);

    showScreen('complete');
    createConfetti();
}

// ============ STORAGE ============
function saveProgress() {
    localStorage.setItem('marathiGame_wordProgress', JSON.stringify(gameState.wordProgress));
}

function loadProgress() {
    const saved = localStorage.getItem('marathiGame_wordProgress');
    if (saved) {
        gameState.wordProgress = JSON.parse(saved);
    }
}

function saveSession(stars, accuracy) {
    const sessions = JSON.parse(localStorage.getItem('marathiGame_sessions') || '[]');

    sessions.unshift({
        date: new Date().toISOString(),
        letter: gameState.currentLetter,
        stars: stars,
        accuracy: Math.round(accuracy),
        correct: gameState.sessionStats.correct,
        incorrect: gameState.sessionStats.incorrect,
        bestStreak: gameState.sessionStats.bestStreak
    });

    // Keep only last 30 sessions
    sessions.splice(30);

    localStorage.setItem('marathiGame_sessions', JSON.stringify(sessions));

    // Update total stars
    let totalStars = parseInt(localStorage.getItem('marathiGame_totalStars') || '0');
    totalStars += stars;
    localStorage.setItem('marathiGame_totalStars', totalStars);

    // Update candy progress
    let candyStars = parseInt(localStorage.getItem('marathiGame_candyStars') || '0');
    candyStars += stars;
    localStorage.setItem('marathiGame_candyStars', candyStars);
}

// ============ STATS SCREEN ============
function updateStatsScreen() {
    const sessions = JSON.parse(localStorage.getItem('marathiGame_sessions') || '[]');
    const totalStars = parseInt(localStorage.getItem('marathiGame_totalStars') || '0');
    const candyStars = parseInt(localStorage.getItem('marathiGame_candyStars') || '0');

    // Count mastered words (5+ successful repetitions)
    let masteredCount = 0;
    for (const key in gameState.wordProgress) {
        if (gameState.wordProgress[key].repetitions >= 5) {
            masteredCount++;
        }
    }

    // Update summary
    document.getElementById('total-stars').textContent = totalStars;
    document.getElementById('words-mastered-count').textContent = masteredCount;
    document.getElementById('sessions-count').textContent = sessions.length;

    // Update candy tracker
    const candyProgress = (candyStars % CONFIG.STARS_FOR_CANDY) / CONFIG.STARS_FOR_CANDY * 100;
    const starsNeeded = CONFIG.STARS_FOR_CANDY - (candyStars % CONFIG.STARS_FOR_CANDY);
    const candiesEarned = Math.floor(candyStars / CONFIG.STARS_FOR_CANDY);

    document.getElementById('candy-progress-fill').style.width = `${candyProgress}%`;

    if (candiesEarned > 0) {
        document.getElementById('candy-status').textContent =
            `${candiesEarned} candy earned! ${starsNeeded} more stars for next candy.`;
    } else {
        document.getElementById('candy-status').textContent =
            `${starsNeeded} more stars needed for candy!`;
    }

    // Update session history
    const historyContainer = document.getElementById('session-history');
    historyContainer.innerHTML = '';

    sessions.slice(0, 10).forEach(session => {
        const date = new Date(session.date);
        const dateStr = date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <span class="history-date">${dateStr} (${session.letter})</span>
            <span class="history-stats">
                <span class="history-stars">${'⭐'.repeat(session.stars)}</span>
                <span>${session.accuracy}%</span>
            </span>
        `;
        historyContainer.appendChild(item);
    });

    if (sessions.length === 0) {
        historyContainer.innerHTML = '<p>No sessions yet. Start practicing!</p>';
    }
}

function resetCandyProgress() {
    if (confirm('Reset candy progress? This will clear the candy counter but keep other progress.')) {
        localStorage.setItem('marathiGame_candyStars', '0');
        updateStatsScreen();
    }
}

function clearAllData() {
    if (confirm('Clear ALL data? This will reset everything and cannot be undone!')) {
        localStorage.removeItem('marathiGame_wordProgress');
        localStorage.removeItem('marathiGame_sessions');
        localStorage.removeItem('marathiGame_totalStars');
        localStorage.removeItem('marathiGame_candyStars');
        gameState.wordProgress = {};
        updateStatsScreen();
        alert('All data cleared!');
    }
}

// ============ UTILITIES ============
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
