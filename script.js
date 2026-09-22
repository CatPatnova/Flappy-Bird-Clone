(function () {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('overlay');
    const subMessage = document.getElementById('subMessage');
    const scoreEl = document.getElementById('score');

    const W = canvas.width;
    const H = canvas.height;

    // Game constants
    const GRAVITY = 0.4;
    const FLAP_STRENGTH = -7.5;
    const PIPE_WIDTH = 60;
    const PIPE_GAP = 160;
    const PIPE_SPEED = 2.5;
    const PIPE_INTERVAL = 90; // frames between pipes
    const GROUND_HEIGHT = 80;

    let bird, pipes, frameCount, score, state; // state: 'ready' | 'playing' | 'over'

    function resetGame() {
        bird = {
            x: 80,
            y: H / 2,
            velocity: 0,
            radius: 14,
            rotation: 0
        };
        pipes = [];
        frameCount = 0;
        score = 0;
        scoreEl.textContent = score;
        state = 'ready';
        subMessage.textContent = 'Click to start';
        overlay.style.display = 'flex';
    }

    function flap() {
        if (state === 'ready') {
            state = 'playing';
            overlay.style.display = 'none';
        }
        if (state === 'playing') {
            bird.velocity = FLAP_STRENGTH;
        }
        if (state === 'over') {
            resetGame();
        }
    }

    function spawnPipe() {
        const minTop = 40;
        const maxTop = H - GROUND_HEIGHT - PIPE_GAP - 40;
        const topHeight = Math.random() * (maxTop - minTop) + minTop;
        pipes.push({
            x: W,
            topHeight: topHeight,
            passed: false
        });
    }

    function update() {
        if (state !== 'playing') return;

        frameCount++;

        // Bird physics
        bird.velocity += GRAVITY;
        bird.y += bird.velocity;
        bird.rotation = Math.max(-0.5, Math.min(1.2, bird.velocity / 10));

        // Spawn pipes
        if (frameCount % PIPE_INTERVAL === 0) {
            spawnPipe();
        }

        // Move pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
            const pipe = pipes[i];
            pipe.x -= PIPE_SPEED;

            // Scoring
            if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
                pipe.passed = true;
                score++;
                scoreEl.textContent = score;
            }

            // Remove off-screen pipes
            if (pipe.x + PIPE_WIDTH < 0) {
                pipes.splice(i, 1);
            }
        }

        // Collisions with ground/ceiling
        if (bird.y + bird.radius > H - GROUND_HEIGHT || bird.y - bird.radius < 0) {
            endGame();
            return;
        }

        // Collisions with pipes
        for (const pipe of pipes) {
            const withinX = bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + PIPE_WIDTH;
            if (withinX) {
                const hitsTop = bird.y - bird.radius < pipe.topHeight;
                const hitsBottom = bird.y + bird.radius > pipe.topHeight + PIPE_GAP;
                if (hitsTop || hitsBottom) {
                    endGame();
                    return;
                }
            }
        }
    }

    function endGame() {
        state = 'over';
        overlay.style.display = 'flex';
        subMessage.textContent = 'Score: ' + score + ' — Click to retry';
    }

    function drawBackground() {
        // Simple clouds
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        const t = frameCount * 0.2;
        for (let i = 0; i < 3; i++) {
            const cx = ((i * 180 + t) % (W + 100)) - 50;
            const cy = 80 + i * 60;
            ctx.beginPath();
            ctx.arc(cx, cy, 20, 0, Math.PI * 2);
            ctx.arc(cx + 20, cy + 5, 25, 0, Math.PI * 2);
            ctx.arc(cx - 20, cy + 5, 18, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawPipes() {
        for (const pipe of pipes) {
            // Top pipe
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pipe-green');
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pipe-dark');
            ctx.fillRect(pipe.x - 4, pipe.topHeight - 20, PIPE_WIDTH + 8, 20);

            // Bottom pipe
            const bottomY = pipe.topHeight + PIPE_GAP;
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pipe-green');
            ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, H - GROUND_HEIGHT - bottomY);
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pipe-dark');
            ctx.fillRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, 20);
        }
    }

    function drawGround() {
        ctx.fillStyle = '#ded895';
        ctx.fillRect(0, H - GROUND_HEIGHT, W, GROUND_HEIGHT);
        ctx.fillStyle = '#c9c17a';
        const stripeOffset = (frameCount * PIPE_SPEED) % 40;
        for (let x = -stripeOffset; x < W; x += 40) {
            ctx.fillRect(x, H - GROUND_HEIGHT, 20, 10);
        }
    }

    function drawBird() {
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(bird.rotation);

        // Body
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.ellipse(0, 0, bird.radius, bird.radius * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wing
        ctx.fillStyle = '#ffdd55';
        ctx.beginPath();
        const wingFlap = Math.sin(frameCount * 0.3) * 4;
        ctx.ellipse(-2, 2 + wingFlap, 8, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(6, -4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(7, -4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.moveTo(bird.radius - 2, -2);
        ctx.lineTo(bird.radius + 8, 0);
        ctx.lineTo(bird.radius - 2, 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        drawBackground();
        drawPipes();
        drawGround();
        drawBird();
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

    // Input handling
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            flap();
        }
    });
    canvas.addEventListener('mousedown', flap);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        flap();
    }, { passive: false });
    overlay.addEventListener('click', flap);

    resetGame();
    loop();
})();