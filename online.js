// ==========================================
// ONLINE MULTIPLAYER MODULE FOR LUDO PARTY
// Real-Time 2 Player Online Game (FIXED)
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyDcQHzGzmXJHdml7j-Ry-tVVAil-KSCyQ4",
    authDomain: "ludo-party-online-65b84.firebaseapp.com",
    databaseURL: "https://ludo-party-online-65b84-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ludo-party-online-65b84",
    storageBucket: "ludo-party-online-65b84.firebasestorage.app",
    messagingSenderId: "405003352009",
    appId: "1:405003352009:web:9683f995ab60e5f0f2da18"
};

// Global Variables
let db = null;
let auth = null;
let currentUser = null;
let currentRoomId = null;
let currentRoomRef = null;
let onlineBetAmount = 0;
let myPlayerColor = null;
let isOnlineGame = false;
let roomListener = null;
let queueListener = null;

// ==========================================
// FIREBASE INITIALIZE
// ==========================================
function initFirebaseOnline() {
    try {
        if (typeof firebase === 'undefined') {
            console.log("⏳ Waiting for Firebase SDK...");
            setTimeout(initFirebaseOnline, 500);
            return;
        }

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        db = firebase.database();
        auth = firebase.auth();
        
        console.log("✅ Firebase Connected!");
        
        auth.signInAnonymously()
            .then((result) => {
                currentUser = result.user;
                console.log("✅ User ID:", currentUser.uid);
                setupPresence();
            })
            .catch((error) => {
                console.error("❌ Auth Error:", error);
            });
            
    } catch (error) {
        console.error("❌ Firebase Init Error:", error);
    }
}

function setupPresence() {
    if (!currentUser || !db) return;
    
    const userName = localStorage.getItem('ludo_user_name') || 'Player_' + currentUser.uid.substring(0, 5);
    localStorage.setItem('ludo_user_name', userName);
    
    const userRef = db.ref('users/' + currentUser.uid);
    
    userRef.set({
        name: userName,
        oddhonline: true,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    });
    
    userRef.onDisconnect().update({
        oddhonline: false,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    });
}

// ==========================================
// OVERRIDE PLAY BUTTON
// ==========================================
const originalPlayGame = window.playGame;

window.playGame = function() {
    if (!db || !currentUser) {
        showToast("Connecting...");
        initFirebaseOnline();
        setTimeout(() => {
            if (db && currentUser) {
                startOnlineMatchmaking();
            } else {
                showToast("Offline Mode");
                if (typeof startMatchmaking === 'function') startMatchmaking();
            }
        }, 2000);
        return;
    }
    startOnlineMatchmaking();
};

// ==========================================
// MATCHMAKING SYSTEM (FIXED)
// ==========================================
function startOnlineMatchmaking() {
    onlineBetAmount = currentBet || 100;
    
    if (appState.balance < onlineBetAmount) {
        showToast("Insufficient Balance!");
        return;
    }
    
    // Deduct balance
    appState.balance -= onlineBetAmount;
    saveState();
    
    // Show matchmaking UI
    showScreen('screen-matchmaking');
    document.getElementById('matchmaking-entry').innerText = onlineBetAmount;
    document.getElementById('opponent-name-text').innerText = "Searching...";
    document.getElementById('timer').innerText = "59";
    
    // Start avatar animation
    startAvatarAnimation();
    
    // Join matchmaking queue
    joinMatchmakingQueue();
}

function joinMatchmakingQueue() {
    const userName = localStorage.getItem('ludo_user_name') || 'Player';
    const oddhbet = onlineBetAmount;
    const oddhqueue = 'queue_' + oddhbet;
    
    // Clean up any old listeners
    cleanupListeners();
    
    // Reference to my queue entry
    const myRef = db.ref('matchmaking/' + oddhqueue + '/' + currentUser.uid);
    
    // Add myself to queue
    myRef.set({
        oddhuid: currentUser.uid,
        name: userName,
        oddhbet: oddhbet,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        status: 'waiting'
    });
    
    // Remove from queue on disconnect
    myRef.onDisconnect().remove();
    
    // Listen for other players in queue
    const queueRef = db.ref('matchmaking/' + oddhqueue);
    
    queueListener = queueRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        
        const players = Object.keys(data);
        const waitingPlayers = players.filter(id => {
            return data[id] && data[id].status === 'waiting';
        });
        
        console.log("👥 Players in queue:", waitingPlayers.length);
        
        // Need exactly 2 players
        if (waitingPlayers.length >= 2) {
            // Sort by timestamp to ensure consistent pairing
            const sorted = waitingPlayers.sort((a, b) => {
                return (data[a].timestamp || 0) - (data[b].timestamp || 0);
            });
            
            const player1 = sorted[0];
            const player2 = sorted[1];
            
            // Check if I'm one of the first 2
            if (player1 === currentUser.uid || player2 === currentUser.uid) {
                const oddhopponent = player1 === currentUser.uid ? player2 : player1;
                const opponentData = data[oddhopponent];
                
                // Only player1 creates the room (prevents duplicate)
                if (player1 === currentUser.uid) {
                    console.log("🏠 I am Player 1 - Creating Room");
                    createOnlineRoom(player1, player2, opponentData.name);
                } else {
                    console.log("⏳ I am Player 2 - Waiting for room...");
                    waitForRoom(player1, opponentData.name);
                }
            }
        }
    });
    
    // Setup cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.onclick = () => cancelMatchmaking(myRef, queueRef);
    }
    
    // 59 second timeout
    startMatchmakingTimer(myRef, queueRef);
}

function createOnlineRoom(player1Id, player2Id, opponentName) {
    // Stop queue listener
    cleanupListeners();
    
    // Show opponent found
    showOpponentFound(opponentName);
    
    const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const oddhbet = onlineBetAmount;
    const prize = Math.floor(oddhbet * 2 * 0.95);
    
    const roomData = {
        roomId: roomId,
        oddhbet: oddhbet,
        prize: prize,
        status: 'playing',
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        players: {
            yellow: player1Id,
            red: player2Id
        },
        playerNames: {
            yellow: localStorage.getItem('ludo_user_name') || 'Player1',
            red: opponentName
        },
        currentTurn: 'yellow',
        diceValue: 0,
        diceRolled: false,
        board: {
            yellow: [-1, -1, -1, -1],
            red: [-1, -1, -1, -1]
        },
        winner: null
    };
    
    // Create room
    db.ref('games/' + roomId).set(roomData).then(() => {
        console.log("✅ Room Created:", roomId);
        
        // Update queue entries to point to room
        const queuePath = 'matchmaking/queue_' + oddhbet;
        db.ref(queuePath + '/' + player1Id).update({ status: 'matched', roomId: roomId });
        db.ref(queuePath + '/' + player2Id).update({ status: 'matched', roomId: roomId });
        
        // Join the room
        myPlayerColor = 'yellow';
        currentRoomId = roomId;
        
        setTimeout(() => {
            joinOnlineRoom(roomId);
        }, 1500);
    });
}

function waitForRoom(player1Id, opponentName) {
    showOpponentFound(opponentName);
    
    const oddhbet = onlineBetAmount;
    const myQueueRef = db.ref('matchmaking/queue_' + oddhbet + '/' + currentUser.uid);
    
    // Listen for roomId update
    myQueueRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.roomId) {
            myQueueRef.off();
            
            myPlayerColor = 'red';
            currentRoomId = data.roomId;
            
            console.log("✅ Got Room ID:", data.roomId);
            
            setTimeout(() => {
                joinOnlineRoom(data.roomId);
            }, 1500);
        }
    });
}

function joinOnlineRoom(roomId) {
    console.log("🎮 Joining Room:", roomId, "as", myPlayerColor);
    
    isOnlineGame = true;
    gameMode = 'online';
    players = ['yellow', 'red'];
    
    currentRoomRef = db.ref('games/' + roomId);
    
    // Initialize local board state
    boardState = {
        yellow: Array.from({length: 4}, (_, i) => ({id: i, pos: -1, status: 'base', justSpawned: false})),
        red: Array.from({length: 4}, (_, i) => ({id: i, pos: -1, status: 'base', justSpawned: false}))
    };
    
    // Show game screen
    showScreen('game-screen');
    initBoard();
    createPlayerHubs();
    drawTokens();
    
    // Listen to room updates
    roomListener = currentRoomRef.on('value', (snapshot) => {
        if (!snapshot.exists()) {
            handleOpponentLeft();
            return;
        }
        handleRoomUpdate(snapshot.val());
    });
    
    // Handle disconnect
    currentRoomRef.child('players/' + myPlayerColor).onDisconnect().remove();
}

// ==========================================
// ROOM UPDATE HANDLER (CORE SYNC LOGIC)
// ==========================================
function handleRoomUpdate(data) {
    if (!data || !isOnlineGame) return;
    
    console.log("📡 Room Update:", data.currentTurn, "Dice:", data.diceValue);
    
    // Check for winner
    if (data.winner) {
        handleGameEnd(data.winner, data.prize);
        return;
    }
    
    // Sync board state
    if (data.board) {
        syncBoardState(data.board);
    }
    
    // Update dice display
    if (data.diceValue > 0 && data.diceRolled) {
        diceValue = data.diceValue;
        const diceEl = document.getElementById('dice-' + data.currentTurn);
        if (diceEl) {
            diceEl.innerHTML = createDiceSVG(data.diceValue, data.currentTurn);
        }
    }
    
    // Update turn
    playerTurnIndex = data.currentTurn === 'yellow' ? 0 : 1;
    const isMyTurn = data.currentTurn === myPlayerColor;
    
    // Update UI
    document.querySelectorAll('.player-hub').forEach(h => {
        h.classList.remove('active-player');
        const d = h.querySelector('.dice-container-game');
        if (d) d.style.pointerEvents = 'none';
    });
    
    const activeHub = document.getElementById('hub-' + data.currentTurn);
    if (activeHub) {
        activeHub.classList.add('active-player');
    }
    
    // Enable dice click only for current player
    if (isMyTurn && !data.diceRolled) {
        turnPhase = 'roll';
        const myDice = document.getElementById('dice-' + myPlayerColor);
        if (myDice) myDice.style.pointerEvents = 'auto';
    } else if (isMyTurn && data.diceRolled) {
        turnPhase = 'move';
        showMovableTokens();
    } else {
        turnPhase = 'waiting';
    }
}

function syncBoardState(board) {
    ['yellow', 'red'].forEach(color => {
        if (board[color]) {
            for (let i = 0; i < 4; i++) {
                const pos = board[color][i];
                if (pos === -1) {
                    boardState[color][i].status = 'base';
                    boardState[color][i].pos = -1;
                } else if (pos >= 56) {
                    boardState[color][i].status = 'finished';
                    boardState[color][i].pos = 56;
                } else {
                    boardState[color][i].status = 'track';
                    boardState[color][i].pos = pos;
                }
            }
        }
    });
    drawTokens();
}

function showMovableTokens() {
    clearHighlights();
    
    const tokens = boardState[myPlayerColor];
    const movable = tokens.filter(t => {
        if (t.status === 'finished') return false;
        if (t.status === 'base') return diceValue === 6;
        return t.pos + diceValue <= 56;
    });
    
    if (movable.length === 0) {
        showMessage("কোনো চাল নেই");
        setTimeout(() => endTurn(false), 800);
    } else if (movable.length === 1) {
        // Auto move single token
        onlineMoveToken(movable[0].id);
    } else {
        highlightMovableTokens(myPlayerColor, movable);
    }
}

// ==========================================
// DICE ROLL (ONLINE)
// ==========================================
const originalHandleRoll = window.handleRoll;

window.handleRoll = function(color) {
    if (!isOnlineGame) {
        if (originalHandleRoll) originalHandleRoll(color);
        return;
    }
    
    if (color !== myPlayerColor || turnPhase !== 'roll' || isRolling) {
        console.log("❌ Not my turn or already rolling");
        return;
    }
    
    onlineRollDice();
};

function onlineRollDice() {
    isRolling = true;
    
    const diceEl = document.getElementById('dice-' + myPlayerColor);
    if (diceEl) diceEl.style.pointerEvents = 'none';
    
    // Animate dice
    let count = 0;
    const interval = setInterval(() => {
        const tempVal = Math.floor(Math.random() * 6) + 1;
        if (diceEl) diceEl.innerHTML = createDiceSVG(tempVal, myPlayerColor);
        playSound('roll');
        
        if (++count > 12) {
            clearInterval(interval);
            
            // Final dice value
            const finalDice = Math.floor(Math.random() * 6) + 1;
            diceValue = finalDice;
            
            if (diceEl) diceEl.innerHTML = createDiceSVG(finalDice, myPlayerColor);
            
            console.log("🎲 Rolled:", finalDice);
            
            // Update Firebase
            currentRoomRef.update({
                diceValue: finalDice,
                diceRolled: true
            });
            
            isRolling = false;
        }
    }, 60);
}

// ==========================================
// TOKEN MOVE (ONLINE)
// ==========================================
const originalHandleTokenClick = window.handleTokenClick;

window.handleTokenClick = function(color, tokenId) {
    if (!isOnlineGame) {
        if (originalHandleTokenClick) originalHandleTokenClick(color, tokenId);
        return;
    }
    
    if (color !== myPlayerColor || turnPhase !== 'move') return;
    
    const animEl = document.getElementById(`anim-group-${color}-${tokenId}`);
    if (animEl && animEl.classList.contains('token-highlight')) {
        onlineMoveToken(tokenId);
    }
};

function onlineMoveToken(tokenId) {
    clearHighlights();
    turnPhase = 'moving';
    
    currentRoomRef.once('value').then(snapshot => {
        const data = snapshot.val();
        if (!data) return;
        
        const board = JSON.parse(JSON.stringify(data.board));
        const currentPos = board[myPlayerColor][tokenId];
        let newPos;
        
        if (currentPos === -1 && diceValue === 6) {
            newPos = 0;
        } else {
            newPos = Math.min(currentPos + diceValue, 56);
        }
        
        board[myPlayerColor][tokenId] = newPos;
        
        // Check for kill
        const oddhopponentColor = myPlayerColor === 'yellow' ? 'red' : 'yellow';
        let gotKill = false;
        
        if (newPos > 0 && newPos < 51) {
            const globalIdx = (startIndices[myPlayerColor] + newPos) % 52;
            
            if (!safeCells.includes(globalIdx)) {
                for (let i = 0; i < 4; i++) {
                    const oppPos = board[oddhopponentColor][i];
                    if (oppPos > 0 && oppPos < 51) {
                        const oppGlobalIdx = (startIndices[oddhopponentColor] + oppPos) % 52;
                        if (oppGlobalIdx === globalIdx) {
                            board[oddhopponentColor][i] = -1;
                            gotKill = true;
                            playSound('kill');
                            showMessage("গুটি কাটা গেছে!");
                        }
                    }
                }
            }
        }
        
        // Check win
        const allFinished = board[myPlayerColor].every(pos => pos === 56);
        
        // Determine next turn
        let nextTurn = myPlayerColor;
        let keepTurn = diceValue === 6 || gotKill || allFinished;
        
        if (!keepTurn) {
            nextTurn = oddhopponentColor;
        }
        
        // Update Firebase
        const updateData = {
            board: board,
            currentTurn: nextTurn,
            diceValue: 0,
            diceRolled: false
        };
        
        if (allFinished) {
            updateData.winner = myPlayerColor;
            updateData.status = 'finished';
        }
        
        currentRoomRef.update(updateData);
        
        playSound('move');
    });
}

function endTurn(gotBonus) {
    if (!currentRoomRef) return;
    
    const nextTurn = gotBonus ? myPlayerColor : (myPlayerColor === 'yellow' ? 'red' : 'yellow');
    
    currentRoomRef.update({
        currentTurn: nextTurn,
        diceValue: 0,
        diceRolled: false
    });
}

// ==========================================
// GAME END HANDLERS
// ==========================================
function handleGameEnd(winner, prize) {
    console.log("🏆 Game Over! Winner:", winner);
    
    isOnlineGame = false;
    cleanupRoom();
    
    if (winner === myPlayerColor) {
        appState.balance += prize;
        appState.wins++;
        addTransaction('game_win', prize, 'success', 'Online Win: +' + prize);
        
        document.getElementById('win-title').innerText = "🎉 YOU WON!";
        document.getElementById('win-message').innerText = "You won " + prize + " coins!";
    } else {
        appState.losses++;
        addTransaction('game_loss', onlineBetAmount, 'success', 'Online Loss: -' + onlineBetAmount);
        
        document.getElementById('win-title').innerText = "😢 YOU LOST";
        document.getElementById('win-message').innerText = "Better luck next time!";
    }
    
    saveState();
    document.getElementById('win-modal').style.display = 'flex';
}

function handleOpponentLeft() {
    console.log("👋 Opponent Left!");
    
    isOnlineGame = false;
    cleanupRoom();
    
    appState.balance += onlineBetAmount;
    saveState();
    
    showToast("Opponent disconnected! Bet refunded.");
    
    setTimeout(() => {
        document.getElementById('win-modal').style.display = 'none';
        goToWalletDashboard();
    }, 2000);
}

// ==========================================
// CLEANUP & UTILITY
// ==========================================
function cleanupListeners() {
    if (queueListener) {
        db.ref('matchmaking').off();
        queueListener = null;
    }
}

function cleanupRoom() {
    if (roomListener && currentRoomRef) {
        currentRoomRef.off();
        roomListener = null;
    }
    
    if (currentRoomId && db) {
        db.ref('games/' + currentRoomId).remove();
    }
    
    currentRoomRef = null;
    currentRoomId = null;
}

function startAvatarAnimation() {
    if (window.avatarInterval) clearInterval(window.avatarInterval);
    
    window.avatarInterval = setInterval(() => {
        const el = document.getElementById('random-avatar-img');
        if (el) {
            el.setAttribute('href', 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + Math.random());
        }
    }, 333);
}

function showOpponentFound(name) {
    clearInterval(window.avatarInterval);
    clearInterval(window.onlineMatchTimer);
    
    const el = document.getElementById('opponent-name-text');
    if (el) {
        el.innerText = name;
        el.setAttribute('fill', '#000');
    }
    
    showToast("Match Found: " + name);
}

function startMatchmakingTimer(myRef, queueRef) {
    let timeLeft = 59;
    const timerEl = document.getElementById('timer');
    
    if (window.onlineMatchTimer) clearInterval(window.onlineMatchTimer);
    
    window.onlineMatchTimer = setInterval(() => {
        timeLeft--;
        if (timerEl) timerEl.innerText = timeLeft < 10 ? '0' + timeLeft : timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(window.onlineMatchTimer);
            clearInterval(window.avatarInterval);
            
            cleanupListeners();
            myRef.remove();
            
            // Play with AI instead
            playWithAI();
        }
    }, 1000);
}

function cancelMatchmaking(myRef, queueRef) {
    clearInterval(window.onlineMatchTimer);
    clearInterval(window.avatarInterval);
    
    cleanupListeners();
    if (myRef) myRef.remove();
    
    appState.balance += onlineBetAmount;
    saveState();
    
    showToast("Match Cancelled! Refunded.");
    goToWalletDashboard();
}

function playWithAI() {
    const aiNames = ["Rayhan", "Faruk", "Arman", "Rahul", "Sani", "Rashed"];
    const aiName = aiNames[Math.floor(Math.random() * aiNames.length)];
    
    showOpponentFound(aiName);
    
    setTimeout(() => {
        isOnlineGame = false;
        startGame('vsAI', 2);
        showScreen('game-screen');
    }, 2000);
}

// Override finishGameSession
const originalFinishGameSession = window.finishGameSession;

window.finishGameSession = function() {
    if (isOnlineGame) {
        document.getElementById('win-modal').style.display = 'none';
        goToWalletDashboard();
    } else if (originalFinishGameSession) {
        originalFinishGameSession();
    }
};

// ==========================================
// INITIALIZE ON LOAD
// ==========================================
window.addEventListener('load', () => {
    console.log("🎮 Online Module Loading...");
    setTimeout(initFirebaseOnline, 1000);
});

console.log("✅ Real-Time Online Module Ready!");
