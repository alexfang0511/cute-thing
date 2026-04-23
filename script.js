/* ════════════════════════════════════════════════
   WHERE WE WERE — Game Script
   ════════════════════════════════════════════════

   HOW TO CUSTOMISE:
   ─ Quiz questions & images  →  edit QUIZ_DATA below
   ─ Image paths              →  change the `image` field
                                  (e.g. 'assets/image1.jpg')
   ─ Formspree endpoint       →  set FORMSPREE_URL below,
                                  AND update the form's
                                  action attribute in index.html
   ─ Reward options           →  edit the data-reward attrs
                                  and labels in index.html
   ─ Personal message         →  edit the <p class="reward-message">
                                  block in index.html

   ════════════════════════════════════════════════ */


/* ════════════════════════════════════════════════
   CONFIGURATION — edit freely
   ════════════════════════════════════════════════ */

/**
 * Your Formspree form endpoint.
 * Replace YOUR_FORM_ID with the ID from your Formspree dashboard.
 * Must also be updated in the <form action="…"> attribute in index.html.
 */
const FORMSPREE_URL = 'https://formspree.io/f/xaqaapwv';

/**
 * Quiz levels — one object per level.
 *
 * image    {string}   Path to the photo. Use your own JPGs here once ready.
 * alt      {string}   Brief description (screen readers + image load fallback).
 * question {string}   The question displayed above the answers.
 * answers  {string[]} Exactly 3 answer strings.
 * correct  {number}   0-based index of the correct answer (0, 1, or 2).
 */
const QUIZ_DATA = [
    {
        image:    'assets/image1.jpg',
        alt:      'Our first spot',
        question: 'Where was this pic of our very first date?',
        answers:  ['Marugame Udon', 'Kizuki Ramen', 'Round 1'],
        correct:  1                              
    },
    {
        image:    'assets/image2.jpg',
        alt:      'A place we visited together',
        question: 'Where did we take this photo together?',
        answers:  ['A Milktea place', 'Cat cafe', 'A pic 5 years in future'],
        correct:  1
    },
    {
        image:    'assets/image3.jpg',
        alt:      'Our favourite spot',
        question: 'Where was this taken?',
        answers:  ['Exploratorium', 'Santana Row', 'SF Botanical Garden'],
        correct:  2
    },
    {
        image:    'assets/image4.jpg',
        alt:      'Our first road trip destination',
        question: 'Where was our first road trip?',
        answers:  ['San Diego', 'Snoopy Museum', 'Runyon Canyon'],
        correct:  0
    }
];


/* ════════════════════════════════════════════════
   STATE
   ════════════════════════════════════════════════ */

let currentLevel = 0;
let audioCtx     = null; // lazily initialised on first user tap


/* ════════════════════════════════════════════════
   DOM REFERENCES
   ════════════════════════════════════════════════ */

const screenQuiz   = document.getElementById('screen-quiz');
const screenReward = document.getElementById('screen-reward');
const screenCustom = document.getElementById('screen-custom');
const screenThanks = document.getElementById('screen-thanks');

const progressFill = document.getElementById('progress-fill');
const progressBar  = progressFill.closest('[role="progressbar"]');
const levelLabel   = document.getElementById('level-label');
const levelImage   = document.getElementById('level-image');
const questionText = document.getElementById('question-text');
const answersGrid  = document.getElementById('answers-grid');

const rewardForm       = document.getElementById('reward-form');
const rewardInput      = document.getElementById('reward-input');
const rewardBtns       = document.querySelectorAll('.reward-btn');

const customTextarea   = document.getElementById('custom-textarea');
const btnCustomBack    = document.getElementById('btn-custom-back');
const btnCustomSubmit  = document.getElementById('btn-custom-submit');


/* ════════════════════════════════════════════════
   QUIZ — RENDERING
   ════════════════════════════════════════════════ */

/**
 * Renders the current level's photo, question, and 3 answer buttons.
 * Called on init and after each correct answer.
 */
function renderLevel() {
    const level    = QUIZ_DATA[currentLevel];
    const levelNum = currentLevel + 1;
    const total    = QUIZ_DATA.length;

    // Update progress — shows levels COMPLETED so far (feels satisfying)
    updateProgress(currentLevel, total);

    levelLabel.textContent = `Level ${levelNum} of ${total}`;

    // Swap the photo and restart the unblur animation
    levelImage.classList.remove('is-unblurring');
    void levelImage.offsetWidth; // force reflow so animation replays
    levelImage.src = level.image;
    levelImage.alt = level.alt;
    levelImage.classList.add('is-unblurring');

    // Update question
    questionText.textContent = level.question;

    // Build answer buttons
    answersGrid.innerHTML = '';
    level.answers.forEach((text, index) => {
        const btn       = document.createElement('button');
        btn.className   = 'answer-btn';
        btn.textContent = text;
        btn.addEventListener('click', () => handleAnswer(index, btn));
        answersGrid.appendChild(btn);
    });

    // Animate the question + answers into view
    triggerEntranceAnimation();
}

/** Updates the progress bar and ARIA attribute. */
function updateProgress(completed, total) {
    const pct = (completed / total) * 100;
    progressFill.style.width = `${pct}%`;
    progressBar.setAttribute('aria-valuenow', completed);
}

/**
 * Forces the entrance animation to replay by briefly removing
 * the class, triggering a reflow, then re-adding it.
 */
function triggerEntranceAnimation() {
    [questionText, answersGrid].forEach(el => {
        el.classList.remove('is-entering');
        void el.offsetWidth; // force reflow so animation replays
        el.classList.add('is-entering');
    });
}


/* ════════════════════════════════════════════════
   QUIZ — ANSWER HANDLING
   ════════════════════════════════════════════════ */

/**
 * Handles a tap on an answer button.
 * @param {number}      chosenIndex  Index of the tapped button.
 * @param {HTMLElement} btn          The tapped <button> element.
 */
function handleAnswer(chosenIndex, btn) {
    // Block all buttons immediately to prevent double-taps
    setAnswersEnabled(false);

    if (chosenIndex === QUIZ_DATA[currentLevel].correct) {
        onCorrect(btn);
    } else {
        onWrong(btn);
    }
}

/** Correct answer: green highlight → advance progress → next level or reward. */
function onCorrect(btn) {
    btn.classList.add('answer-btn--correct');
    playTone('correct');

    // Advance progress bar right away for instant visual reward
    currentLevel++;
    updateProgress(currentLevel, QUIZ_DATA.length);

    setTimeout(() => {
        if (currentLevel < QUIZ_DATA.length) {
            renderLevel();
            setAnswersEnabled(true);
        } else {
            // All 4 levels complete — fade to the reward screen
            transitionTo(screenQuiz, screenReward);
        }
    }, 780);
}

/** Wrong answer: red shake → allow retry (no penalty). */
function onWrong(btn) {
    btn.classList.add('answer-btn--incorrect');
    playTone('incorrect');

    // Remove error state after the shake animation, then allow retry
    setTimeout(() => {
        btn.classList.remove('answer-btn--incorrect');
        setAnswersEnabled(true);
    }, 560);
}

/** Enables or disables every answer button in the grid. */
function setAnswersEnabled(enabled) {
    answersGrid.querySelectorAll('.answer-btn').forEach(btn => {
        btn.disabled = !enabled;
    });
}


/* ════════════════════════════════════════════════
   AUDIO FEEDBACK
   Uses the Web Audio API — no external files needed.
   Silently skipped if the browser blocks audio.
   ════════════════════════════════════════════════ */

/**
 * Plays a short tone.
 * Correct → pleasant ascending chime (C5 → E5 → G5).
 * Wrong   → soft descending low pulse.
 *
 * @param {'correct'|'incorrect'} type
 */
function playTone(type) {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        const now  = audioCtx.currentTime;
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'correct') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);        // C5
            osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.24); // G5
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
            osc.start(now);
            osc.stop(now + 0.65);
        } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.setValueAtTime(210, now + 0.15);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
            osc.start(now);
            osc.stop(now + 0.42);
        }
    } catch (_) {
        // Audio is a nice-to-have; do nothing if unavailable
    }
}


/* ════════════════════════════════════════════════
   SCREEN TRANSITIONS
   ════════════════════════════════════════════════ */

/**
 * Fades one screen out and another in.
 * A short staggered delay lets the fade-out start first.
 *
 * @param {HTMLElement} from  The currently-visible screen.
 * @param {HTMLElement} to    The screen to show.
 */
function transitionTo(from, to) {
    from.classList.remove('screen--active');
    from.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
        to.classList.add('screen--active');
        to.setAttribute('aria-hidden', 'false');
        to.scrollTop = 0;
    }, 260);
}


/* ════════════════════════════════════════════════
   REWARD SELECTION
   ════════════════════════════════════════════════ */

/**
 * Posts the chosen reward/wish to Formspree and fades to the thank-you screen.
 * Shared by both the reward buttons and the custom wish flow.
 *
 * @param {string}      value       Text to send as the `reward` field.
 * @param {HTMLElement} fromScreen  The screen to fade out of.
 */
async function submitAndThankYou(value, fromScreen) {
    rewardInput.value = value;

    try {
        const formData = new FormData(rewardForm);
        await fetch(FORMSPREE_URL, {
            method:  'POST',
            body:    formData,
            headers: { Accept: 'application/json' }
        });
    } catch (_) {
        // Network errors are silently swallowed —
        // we always show the thank-you screen regardless.
    }

    transitionTo(fromScreen, screenThanks);
}

/** Called when one of the four preset reward buttons is tapped. */
async function handleRewardSelection(rewardName) {
    rewardBtns.forEach(btn => { btn.disabled = true; });
    await submitAndThankYou(rewardName, screenReward);
}

/** Called when the custom-wish submit button is tapped. */
async function handleCustomSubmit() {
    const wish = customTextarea.value.trim();

    if (!wish) {
        // Shake the textarea to indicate input is required
        customTextarea.classList.remove('is-empty');
        void customTextarea.offsetWidth;
        customTextarea.classList.add('is-empty');
        return;
    }

    btnCustomSubmit.disabled    = true;
    btnCustomSubmit.textContent = 'Sending…';

    await submitAndThankYou(`Custom wish: ${wish}`, screenCustom);
}


/* ════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    // Draw level 1
    renderLevel();

    // Wire up reward buttons — custom button opens the wish screen instead
    rewardBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.id === 'btn-custom') {
                transitionTo(screenReward, screenCustom);
            } else {
                handleRewardSelection(btn.dataset.reward);
            }
        });
    });

    // Custom wish screen — back button
    btnCustomBack.addEventListener('click', () => {
        transitionTo(screenCustom, screenReward);
    });

    // Custom wish screen — send button
    btnCustomSubmit.addEventListener('click', handleCustomSubmit);
});
