const quizData = [
    {
        question: "Where was our very first date?",
        options: ["The Coffee Shop", "The Park", "The Italian Place", "The Movies"],
        correct: 2 // Index of the correct answer
    },
    {
        question: "What is my favorite thing about you?",
        options: ["Your smile", "Your kindness", "Everything", "Your cooking"],
        correct: 2
    },
    {
        question: "How many days have we been together?",
        options: ["500", "732", "Too many to count", "100"],
        correct: 1
    }
];

let currentQuestion = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadQuestion();

    // Elements for the final game
    const boxWrapper = document.getElementById('boxWrapper');
    const gameContainer = document.getElementById('game-container');
    const revealContainer = document.getElementById('reveal-container');
    const finalYes = document.getElementById('finalYes');

    function loadQuestion() {
        const data = quizData[currentQuestion];
        document.getElementById('question-text').innerText = data.question;
        const optionsDiv = document.getElementById('options-container');
        optionsDiv.innerHTML = ""; // Clear old buttons

        data.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.className = "quiz-btn";
            btn.onclick = () => checkAnswer(index);
            optionsDiv.appendChild(btn);
        });
    }

    function checkAnswer(index) {
        if (index === quizData[currentQuestion].correct) {
            currentQuestion++;
            if (currentQuestion < quizData.length) {
                loadQuestion();
                document.getElementById('feedback').classList.add('hidden');
            } else {
                startGame();
            }
        } else {
            document.getElementById('feedback').classList.remove('hidden');
        }
    }

    function startGame() {
        document.getElementById('quiz-container').classList.add('hidden');
        gameContainer.classList.remove('hidden');
    }

    // "Chase" Logic for the gift box
    let boxX = window.innerWidth / 2;
    let boxY = window.innerHeight / 2;

    document.addEventListener('mousemove', (e) => {
        if (gameContainer.classList.contains('hidden')) return;
        
        const speed = 0.04;
        boxX += (e.clientX - boxX) * speed;
        boxY += (e.clientY - boxY) * speed;

        boxWrapper.style.left = `${boxX}px`;
        boxWrapper.style.top = `${boxY}px`;
    });

    boxWrapper.addEventListener('click', () => {
        gameContainer.classList.add('hidden');
        revealContainer.classList.remove('hidden');
        document.body.style.background = "radial-gradient(circle, #b12de0 0%, #4a0a6e 100%)";
    });

    finalYes.addEventListener('click', () => {
        alert("The best day ever! ❤️");
    });
});