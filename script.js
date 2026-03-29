document.addEventListener('DOMContentLoaded', () => {
    const boxWrapper = document.getElementById('boxWrapper');
    const gameScene = document.getElementById('gameScene');
    const revealScene = document.getElementById('revealScene');
    const finalYes = document.getElementById('finalYes');
    
    // Start the box in the middle
    let boxX = window.innerWidth / 2;
    let boxY = window.innerHeight / 2;

    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const speed = 0.04; // Adjust for difficulty

        boxX += (mouseX - boxX) * speed;
        boxY += (mouseY - boxY) * speed;

        boxWrapper.style.left = `${boxX}px`;
        boxWrapper.style.top = `${boxY}px`;
        
        // Add a little wobble
        const wobble = Math.sin(Date.now() / 200) * 5;
        boxWrapper.style.transform = `translate(-50%, -50%) rotate(${wobble}deg)`;
    });

    boxWrapper.addEventListener('click', () => {
        // Romantic transition
        document.body.style.background = "radial-gradient(circle, #b12de0 0%, #4a0a6e 100%)";
        gameScene.classList.add('hidden');
        revealScene.classList.remove('hidden');
    });

    finalYes.addEventListener('click', () => {
        alert("The best day ever! ❤️");
    });
});