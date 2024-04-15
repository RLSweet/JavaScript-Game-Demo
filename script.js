// Access the canvas element and its drawing context to enable drawing, set its width and height
const canvas = document.getElementById('gameCanvas');  
const ctx = canvas.getContext('2d');
canvas.width = 1027;
canvas.height = 576;

// Load background image for the game
let backgroundImage = new Image();
backgroundImage.src = './assets/map.png'; // Path to the background image

// Flag to track if the menu should be shown
let showMenu = true;

// Load the menu background image
let menuBackground = new Image();
menuBackground.src = './assets/menu.png';
// load item sprite
let itemSprite = new Image();
itemSprite.src = './assets/feather.png';

//music 
let backgroundMusic = new Audio('./assets/Truth.mp3');
backgroundMusic.volume = 0.05;
backgroundMusic.loop = true; //


// load end menu
// let victoryScreenImage = new Image();
// victoryScreenImage.src = './assets/endMenu.png'; 
// victory variables
let showVictoryScreen = false;
const victoryMenuWidth = canvas.width * 0.75;
const victoryMenuHeight = canvas.height * 0.75;
const victoryMenuX = canvas.width * 0.125;
const victoryMenuY = canvas.height * 0.125;

let dummyImage = new Image();
dummyImage.src = './assets/dummy.png'; // Path to your training dummy PNG image

//load sprite images
const sprites = {
    idle: { src: './assets/knight/idle.png', frames: 4, currentFrame: 0, frameDelay: 10 },
    run: { src: './assets/knight/run.png', frames: 10, currentFrame: 0, frameDelay: 5 },
    jump: { src: './assets/knight/jump.png', frames: 3, currentFrame: 0, frameDelay: 5 },
    land: { src: './assets/knight/land.png', frames: 3, currentFrame: 0, frameDelay: 5 },
    attack: { src: './assets/knight/attack.png', frames: 7, currentFrame: 0, frameDelay: 2 },
};

//initialize images and frame counters
Object.keys(sprites).forEach(key => {
    sprites[key].image = new Image();
    sprites[key].image.src = sprites[key].src;
});


//speech bubble stuff
let speechBubbleImage = new Image();
speechBubbleImage.src = './assets/bubble.png'; // Adjust path as needed

let speechBubbleTimer = null;
let showSpeechBubble = false;

 
// physics constants to simulate gravity and control movement
const gravity = 0.8;
let jumpHeight = -6; 
const movementSpeed = 6;

// ====================== PLAYER ===========================
// defining player object with properties for position, size, movement, and attack
let playerOne = {
    x: 50, // Starting x position
    y: 410, // Starting y position
    width: 128 / 2, // Player width
    height: 128 / 2, // Player height
    dy: 0, // Change in y position, used with gravity to simulate jumping/falling
    isOnGround: false, // Flag to check if player is on the ground
    facing: "right", // Direction player is facing, affects attack direction
    attackHitbox: { width: 64, height: 64, offsetX: 0, offsetY: 0}, // Dimensions and offset of attack hitbox from player position
    isAttacking: false, // Flag to check if player is currently attacking
    attackCooldown: 650, // Minimum time between attacks
    lastAttackTime: 0, // Timestamp of the last attack, used to enforce cooldown
    attackDamage: 4, // Damage dealt with each attack
    state: 'idle', // Current animation state
    prevState: '', // Previous animation state for comparison
    frameTime: 0, // Time since last frame change
    
};

// Attack function checks cooldown, updates state, and resets after an interval
function attemptAttack() {
    const currentTime = Date.now();
    if (currentTime - playerOne.lastAttackTime >= playerOne.attackCooldown) {
        playerOne.isAttacking = true;
        playerOne.lastAttackTime = currentTime;
        // Placeholder for actual attack logic
        setTimeout(() => {
            playerOne.isAttacking = false; // End attack after a short duration
        }, 200);
    }
}
// ====================================== COIN ===========================================
let collectibleItem = {
    x: 900, // Example position - adjust as needed
    y: 450, // Example position - adjust as needed
    width: 32, // Item width
    height: 32, // Item height
    collected: false // Flag to track if the item has been collected
};

function drawItem() {
    if (!collectibleItem.collected) {
        ctx.fillStyle = "blue"; // Set fill color for the item
        ctx.drawImage(itemSprite, collectibleItem.x, collectibleItem.y, collectibleItem.width, collectibleItem.height);
    }
}

// ============================= quest =================================================
let quest = {
    description: "Quest: Destroy the training dummy",
    completed: false
};


function drawQuestStatus() {
    ctx.font = '18px Arial'; // Set the desired font
    ctx.fillStyle = quest.completed ? 'green' : 'white'; // Green if completed, white otherwise
    ctx.fillText(quest.description + (quest.completed ? " - Completed!" : ""), 20, 30); // Adjust positioning as needed
}



// ==================================== Training Dummy ===================================
// Define training dummy object with similar properties to player
let trainingDummy = {
    x: 950, // Starting x position
    y: 200, // Starting y position
    width: 60 / 2, // Dummy width
    height: 128 / 2, // Dummy height
    dy: 0, // Change in y position, used with gravity
    isOnGround: false, // Flag to check if dummy is on the ground
    health: 12, // Dummy health
    isActive: true, // Flag to check if dummy is active
    recentlyHit: false, // Flag to prevent rapid re-hitting
};

// Updates the dummy's position and state, applies gravity
function updatetrainingDummy() {
    if (!trainingDummy.isActive) return; // Do nothing if dummy is inactive
    trainingDummy.dy += gravity; // Apply gravity to vertical speed
    trainingDummy.y += trainingDummy.dy; // Update vertical position
    trainingDummy.isOnGround = false; // Assume dummy is not on ground until collision check
    // Check for collisions with platforms and resolve them
    


    handleSolidPlatformCollisionDummy();
    handleTransPlatformCollisionDummy();
}


// DUMMY Respawn function - discontinued
// function respawnDummy() {
//     trainingDummy.health = 12;
//     trainingDummy.isActive = true;
//     trainingDummy.recentlyHit = false;
// }


// Checks and resolves collisions with solid platforms for the dummy
function handleSolidPlatformCollisionDummy() {
    // Check each solid platform for collisions
    solidPlatform.forEach(platform => {
        if (isColliding(trainingDummy, platform)) {
            // Resolve vertical collisions first
            if (trainingDummy.x + trainingDummy.width > platform.x && trainingDummy.x < platform.x + platform.width) {
                // Check for bottom collision (dummy landing on top of platform)
                if (trainingDummy.y + trainingDummy.height - trainingDummy.dy <= platform.y) {
                    trainingDummy.y = platform.y - trainingDummy.height; // Correct dummy's y position
                    trainingDummy.dy = 0; // Stop vertical movement
                    trainingDummy.isOnGround = true; // Mark as on ground
                    return; // Skip horizontal collision check for this platform
                }
                // Check for top collision (dummy hitting underside of platform)
                else if (trainingDummy.y - trainingDummy.dy >= platform.y + platform.height) {
                    trainingDummy.y = platform.y + platform.height; // Correct dummy's y position
                    trainingDummy.dy = 0; // Stop vertical movement
                    return; // Skip horizontal collision check for this platform
                }
            }
        }
    });
    // Then, check and resolve horizontal collisions
    solidPlatform.forEach(platform => {
        if (isColliding(trainingDummy, platform)) {
            // Resolve horizontal collisions
            if (trainingDummy.y + trainingDummy.height > platform.y && trainingDummy.y < platform.y + platform.height) {
                // Right side collision
                if (trainingDummy.x < platform.x + platform.width && trainingDummy.x + trainingDummy.width > platform.x + platform.width) {
                    trainingDummy.x = platform.x + platform.width; // Correct dummy's x position to the right of the platform
                }
                // Left side collision
                else if (trainingDummy.x + trainingDummy.width > platform.x && trainingDummy.x < platform.x) {
                    trainingDummy.x = platform.x - trainingDummy.width; // Correct dummy's x position to the left of the platform
                }
            }
        }
    });
}

// Checks and resolves collisions with transparent platforms for the dummy
function handleTransPlatformCollisionDummy() {
    // Check each transparent platform for collisions
    transPlatform.forEach(platform => {
        if (isColliding(trainingDummy, platform) && trainingDummy.dy >= 0) {
            // Check for collision from above (landing on top of the platform)
            if (trainingDummy.y + trainingDummy.height - trainingDummy.dy <= platform.y) {
                trainingDummy.y = platform.y - trainingDummy.height; // Correct dummy's y position
                trainingDummy.dy = 0; // Stop vertical movement
                trainingDummy.isOnGround = true; // Mark as on ground
            }
        }
    });
}

// Draws the training dummy on the canvas
function drawTrainingDummy() {
    if (trainingDummy.isActive) {
        // Ensure the image is loaded before drawing
        if (dummyImage.complete) {
            ctx.drawImage(dummyImage, trainingDummy.x, trainingDummy.y, trainingDummy.width, trainingDummy.height); // Draw dummy image
        }
    }
}

// Draws health bar above the training dummy
function drawHealthBar() {
    const proximityThreshold = 200; // Distance from player to show health bar
    const distance = Math.abs(playerOne.x - trainingDummy.x); // Calculate distance between player and dummy

    if (!trainingDummy.isActive || distance > proximityThreshold) return; // Don't draw if dummy is inactive or too far

    const healthBarWidth = 50; // Width of the health bar
    const healthBarHeight = 5; // Height of the health bar
    const xOffset = (trainingDummy.width - healthBarWidth) / 2; // Calculate offset to center the health bar above the dummy
    const yOffset = -10; // Vertical offset to position the health bar above the dummy

    // Draw the red background of the health bar (lost health)
    ctx.fillStyle = 'red';
    ctx.fillRect(trainingDummy.x + xOffset, trainingDummy.y + yOffset, healthBarWidth, healthBarHeight);

    // Calculate and draw the green foreground of the health bar (current health)
    const greenWidth = healthBarWidth * (trainingDummy.health / 12); // Calculate width based on current health
    ctx.fillStyle = 'green';
    ctx.fillRect(trainingDummy.x + xOffset, trainingDummy.y + yOffset, greenWidth, healthBarHeight);
}

// Function to draw the player character
function drawPlayerOne() {

     // If player is attacking, draw the attack hitbox
    if (playerOne.isAttacking) {
        // Calculate hitbox position based on player's facing direction
        let hitboxX = playerOne.facing === "right" ? playerOne.x + playerOne.attackHitbox.offsetX : playerOne.x - playerOne.attackHitbox.width;
        let hitboxY = playerOne.y + playerOne.attackHitbox.offsetY;

        // ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Semi-transparent red for the hitbox
        // ctx.fillRect(hitboxX, hitboxY, playerOne.attackHitbox.width, playerOne.attackHitbox.height); // Draw the hitbox

        // Placeholder for attack collision check logic
        checkAttackCollision(hitboxX, hitboxY, playerOne.attackHitbox.width, playerOne.attackHitbox.height);
    }   

    const sprite = sprites[playerOne.state];
    const frameWidth = sprite.image.width / sprite.frames;
    const frameIndex = Math.floor(sprite.currentFrame) % sprite.frames;

    ctx.save();
    if (playerOne.facing === 'left') {
        ctx.scale(-1, 1);
        ctx.drawImage(sprite.image, frameWidth * frameIndex, 0, frameWidth, sprite.image.height, -playerOne.x - playerOne.width, playerOne.y, playerOne.width, playerOne.height);
    } else {
        ctx.drawImage(sprite.image, frameWidth * frameIndex, 0, frameWidth, sprite.image.height, playerOne.x, playerOne.y, playerOne.width, playerOne.height);
    }
    ctx.restore();

    // Update frame based on time for smoother animation
    playerOne.frameTime++;
    if (playerOne.frameTime >= sprite.frameDelay) { // Use frameDelay here
        sprite.currentFrame++;
        playerOne.frameTime = 0;
    }
}


function drawMenu() {
    if (!showMenu) return; // Don't draw if the menu shouldn't be shown

    // Ensure the image is loaded before drawing
    if (menuBackground.complete) {
        ctx.drawImage(menuBackground, 0, 0, canvas.width, canvas.height);
    }

    // Overlay text instructions
    ctx.font = '24px rsfont'; // Adjust font style as needed
    ctx.fillStyle = 'white'; // Text color
    
    ctx.fillText("'A' to move left", canvas.width / 2 - 180, canvas.height - 340); // Adjust positioning as needed
    ctx.fillText("'D' to move right", canvas.width / 2 - 180, canvas.height - 310); // Adjust positioning as needed
    ctx.fillText("'Space' to jump", canvas.width / 2 - 180, canvas.height - 280); // Adjust positioning as needed
    ctx.fillText("'K' to attack", canvas.width / 2 - 180, canvas.height - 250); // Adjust positioning as needed
    ctx.fillText("Press 'Enter' to Start", canvas.width / 2 - 180, canvas.height - 200); // Adjust positioning as needed
    ctx.font = '40px rsfont'; // Adjust font style as needed
    ctx.fillText("Project Demo", canvas.width / 2 - 180, canvas.height - 400); // Adjust positioning as needed


}
// draw victory
function drawVictoryMenu() {
    if (!showVictoryScreen) return;

    // Draw the semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    // Draw the "Victory!" text
    ctx.font = '48px Arial';
    ctx.fillStyle = 'gold';
    ctx.fillText("Level Complete!", canvas.width / 2 - 170, victoryMenuY + 70);

    // Optionally draw the "Play Again" button here
    // For simplicity, the button is text. Click detection will be handled separately.
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText("Next Level", canvas.width / 2 - 70, victoryMenuY + victoryMenuHeight - 40);
}


// Object to track the state of control keys
let keys = {
    right: false, // Right arrow key state
    left: false, // Left arrow key state
    space: false, // Spacebar state
    canJump: true, // Flag to control jump ability
};

// Function to update player state and position
function updatePlayerOne() {
    playerOne.dy += gravity; // Apply gravity to vertical speed
    
    // Update horizontal position based on key state
    if (keys.right) playerOne.x += movementSpeed;
    if (keys.left) playerOne.x -= movementSpeed;

    // Update vertical position
    playerOne.y += playerOne.dy;
    
    playerOne.isOnGround = false; // Assume player is not on ground until collision check

    // Check for and resolve collisions with platforms
    handleSolidPlatformCollision();
    handleTransPlatformCollision();
    if (isColliding(playerOne, collectibleItem) && !collectibleItem.collected) {
        collectibleItem.collected = true;
        jumpHeight = -14;
    }


     // Determine the current state based on player actions
     let newState = 'idle'; // Default state
     if (playerOne.isAttacking) {
         newState = 'attack';
     } else if (!playerOne.isOnGround) {
         newState = playerOne.dy < 0 ? 'jump' : 'land';
     } else if (keys.right || keys.left) {
         newState = 'run';
     }
 
     // Check if the state has changed
     if (newState !== playerOne.state) {
         playerOne.prevState = playerOne.state; // Update prevState before changing current state
         playerOne.state = newState; // Update the state
         sprites[playerOne.state].currentFrame = 0; // Reset animation frame for new state
         playerOne.frameTime = 0; // Reset frame time
     }

    if (playerOne.isAttacking) {
        playerOne.state = 'attack';
    } else if (!playerOne.isOnGround) {
        playerOne.state = 'jump';
    } else if (keys.right || keys.left) {
        playerOne.state = 'run';
    } else {
        playerOne.state = 'idle';
    }
    
}

// =================== PLATFORMS =======================
// Array of solid platforms that cannot be passed through
const solidPlatform = [
    { x: 0, y: 485, width: 1030, height: 10},  // Floor platform
    { x: -15, y: 0, width: 5, height: canvas.height},   // West wall
    { x: 1027, y: 0, width: 20, height: canvas.height},   // East wall
    { x: 709, y: 295, width: 320, height: 10}, // Dummy floor 1
    { x: 678, y: 355, width: 45, height: 10}, // Dummy floor step
];

// Array of transparent platforms that can be jumped through
const transPlatform = [
    { x: 129, y: 388, width: 192, height: 10 },
    { x: 129, y: 230, width: 192, height: 10 },
    { x: 322, y: 323, width: 191, height: 10 },
    { x: 417, y: 195, width: 257, height: 10 },
];

// Function to draw platforms on the canvas (for debugging/level design)
function drawPlatforms() {
    ctx.fillStyle = 'rgba(27, 27, 241, 0.0)'; // Set fill color for solid platforms 
    solidPlatform.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height); // Draw each solid platform
    });
    ctx.fillStyle = 'rgba(255, 0, 0, 0.0)'; // Set fill color for transparent platforms 
    transPlatform.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height); // Draw each transparent platform
    });
}

// Function to check if a player or dummy is colliding with a platform
function isColliding(entity, platform) {
    return entity.x < platform.x + platform.width &&
           entity.x + entity.width > platform.x &&
           entity.y < platform.y + platform.height &&
           entity.y + entity.height > platform.y;
}

// Function to handle collisions between the player and solid platforms
function handleSolidPlatformCollision() {
    solidPlatform.forEach(platform => {
        if (isColliding(playerOne, platform)) {
            // Handle vertical collisions first
            if (playerOne.x + playerOne.width > platform.x && playerOne.x < platform.x + platform.width) {
                // Bottom collision (player landing on the platform)
                if (playerOne.y + playerOne.height - playerOne.dy <= platform.y) {
                    playerOne.y = platform.y - playerOne.height; // Correct player's y position
                    playerOne.dy = 0; // Stop vertical movement
                    playerOne.isOnGround = true; // Mark as on ground
                    return; // Skip horizontal collision check for this platform
                }
                // Top collision (player hitting underside of platform)
                else if (playerOne.y - playerOne.dy >= platform.y + platform.height) {
                    playerOne.y = platform.y + platform.height; // Correct player's y position
                    playerOne.dy = 0; // Stop vertical movement
                    return; // Skip horizontal collision check for this platform
                }
            }
        }
    });

    // Then, check and resolve horizontal collisions
    solidPlatform.forEach(platform => {
        if (isColliding(playerOne, platform)) {
            // Resolve horizontal collisions
            if (playerOne.y + playerOne.height > platform.y && playerOne.y < platform.y + platform.height) {
                // Right side collision
                if (playerOne.x < platform.x + platform.width && playerOne.x + playerOne.width > platform.x + platform.width) {
                    playerOne.x = platform.x + platform.width; // Correct player's x position to the right of the platform
                }
                // Left side collision
                else if (playerOne.x + playerOne.width > platform.x && playerOne.x < platform.x) {
                    playerOne.x = platform.x - playerOne.width; // Correct player's x position to the left of the platform
                }
            }
        }
    });
}

// Function to handle collisions between the player and transparent platforms
function handleTransPlatformCollision() {
    transPlatform.forEach(platform => {
        if (isColliding(playerOne, platform) && playerOne.dy >= 0) {
            // Check for collision from above (landing on top of the platform)
            if (playerOne.y + playerOne.height - playerOne.dy <= platform.y) {
                playerOne.y = platform.y - playerOne.height; // Correct player's y position
                playerOne.dy = 0; // Stop vertical movement
                playerOne.isOnGround = true; // Mark as on ground
            }
        }
    });
}

// Function to check if player's attack collides with the training dummy
function checkAttackCollision(hitboxX, hitboxY, hitboxWidth, hitboxHeight) {
    if (trainingDummy.isActive &&
        !trainingDummy.recentlyHit && // Ensure dummy wasn't hit recently
        hitboxX < trainingDummy.x + trainingDummy.width &&
        hitboxX + hitboxWidth > trainingDummy.x &&
        hitboxY < trainingDummy.y + trainingDummy.height &&
        hitboxY + hitboxHeight > trainingDummy.y) {
        
        trainingDummy.health -= playerOne.attackDamage; // Subtract health from dummy
        trainingDummy.recentlyHit = true; // Mark dummy as recently hit
        console.log(`Dummy health: ${trainingDummy.health}`);
        
        setTimeout(() => { trainingDummy.recentlyHit = false; }, 200); // Reset recently hit flag after delay
        
        if (trainingDummy.health <= 0) {
            trainingDummy.isActive = false; // Deactivate dummy
            quest.completed = true; // Mark quest as completed
            // Other respawn or effect logic here
        }
        if (quest.completed && !trainingDummy.isActive) {
            showVictoryScreen = true;
        }
        
    }
}

function resetGameState() {
    // Reset player state
    playerOne.x = 50; // Starting x position
    playerOne.y = 410; // Starting y position
    playerOne.dy = 0; // Reset any vertical movement
    playerOne.isOnGround = false;
    playerOne.isAttacking = false;
    playerOne.lastAttackTime = 0;
    jumpHeight = -6;

    // Reset game flags
    showMenu = true;
    showVictoryScreen = false;
    
    // Reset quest state
    quest.completed = false;

    // Reset training dummy
    trainingDummy.x = 950;
    trainingDummy.y = 200;
    trainingDummy.health = 12;
    trainingDummy.isActive = true;
    trainingDummy.recentlyHit = false;

    // Reset collectible items
    collectibleItem.collected = false;
}


// Main game loop function, called repeatedly to update and render the game
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // Draw the background image
    if (!showMenu) {
    updatePlayerOne(); // Update player state and position
    updatetrainingDummy(); // Update dummy state and position
    drawTrainingDummy(); // Draw the training dummy
    drawHealthBar(); // Draw the health bar for the dummy
    drawPlatforms(); // Draw platforms (for debugging/level design)
    drawItem()
    drawPlayerOne(); // Draw the player
    drawQuestStatus();

    // Draw speech bubble if flag is set
    if (showSpeechBubble && speechBubbleImage.complete) {
        const bubbleX = playerOne.x + playerOne.width / 2 - (321 / 4);
        const bubbleY = playerOne.y - 237 / 2;
        ctx.drawImage(speechBubbleImage, bubbleX, bubbleY, 321 / 2, 237 / 2);
    }

    }
    drawMenu();
    drawVictoryMenu();
    requestAnimationFrame(gameLoop); // Schedule the next frame of the game loop
}

// Event listeners for player control via keyboard
// Key down events - move player or initiate jump/attack
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && showMenu) {
        showMenu = false;
        backgroundMusic.play();
        setTimeout(() => {
            if (!collectibleItem.collected) {
                showSpeechBubble = true;
                setTimeout(() => {
                    showSpeechBubble = false;
                }, 4500); // Speech bubble visible for 3 seconds
            }
        }, 7000); // Wait 7 seconds to show speech bubble
        return;
    }
    if (event.key === 'd') {
        keys.right = true; // Move player right
        playerOne.facing = "right"; // Update facing direction
    }
    if (event.key === 'a') {
        keys.left = true; // Move player left
        playerOne.facing = "left"; // Update facing direction
    }
    if (event.key === ' ' && !keys.space) {
        keys.space = true; // Initiate jump
        if (keys.canJump && playerOne.isOnGround) {
            playerOne.dy = jumpHeight; // Set jump speed
            playerOne.isOnGround = false; // Player is no longer on the ground
            keys.canJump = false; // Prevent multiple jumps
        }
    }
    if (event.key === 'k') attemptAttack(); // Initiate attack
});

// Key up events - stop movement or reset jump state
document.addEventListener('keyup', (event) => {
    if (event.key === 'd') keys.right = false; // Stop moving right
    if (event.key === 'a') keys.left = false; // Stop moving left
    if (event.key === ' ') {
        keys.space = false; // Reset jump state
        keys.canJump = true; // Allow for next jump
    }
});

document.addEventListener('click', function(event) {
    // Only check clicks if the victory screen is showing
    if (!showVictoryScreen) return;

    // Calculate click position relative to canvas (may need adjustment based on your page layout)
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Check if the click is within the "Play Again" button's area
    // These values need to be adjusted based on your button's position and size
    if (
        clickX >= canvas.width / 2 - 60 &&
        clickX <= canvas.width / 2 + 60 &&
        clickY >= victoryMenuY + victoryMenuHeight - 70 &&
        clickY <= victoryMenuY + victoryMenuHeight - 30
    ) {
        // Reset game state to play again
        resetGameState(); // Implement this function based on your game's requirements
    }
});


// Start the game loop once the background image has loaded
backgroundImage.onload = function() {
    requestAnimationFrame(gameLoop);
};
