// ==========================================
// ONLINE MULTIPLAYER MODULE FOR LUDO PARTY
// Firebase Real-time Online Game
// ==========================================

// Firebase Configuration (আপনার Config)
const firebaseConfig = {
  apiKey: "AIzaSyDcQHzGzmXJHdml7j-Ry-tVVAil-KSCyQ4",
  authDomain: "ludo-party-online-65b84.firebaseapp.com",
  databaseURL: "https://ludo-party-online-65b84-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ludo-party-online-65b84",
  storageBucket: "ludo-party-online-65b84.firebasestorage.app",
  messagingSenderId: "405003352009",
  appId: "1:405003352009:web:9683f995ab60e5f0f2da18",
  measurementId: "G-59P5H9MTYR"
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

// ==========================================
// FIREBASE INITIALIZE
// ==========================================
function initFirebaseOnline() {
    try {
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            db = firebase.database();
            auth = firebase.auth();
            
            console.log("✅ Firebase Connected!");
            
            auth.signInAnonymously()
                .then((result) => {
                    currentUser = result.user;
                    console.log("✅ User ID:", currentUser.uid);
                    syncUserData();
                })
                .catch((error) => {
                    console.error("❌ Auth Error:", error);
                });
        } else {
            console.log("⏳ Waiting for Firebase SDK...");
            setTimeout(initFirebaseOnline, 1000);
        }
    } catch (error) {
        console.error("❌ Firebase Error:", error);
    }
}

// Sync User Data to Firebase
function syncUserData() {
    if (!currentUser || !db) return;
    
    const userName = localStorage.getItem('ludo_user_name') || 'Player' + Math.floor(Math.random() * 9999);
    localStorage.setItem('ludo_user_name', userName);
    
    db.ref('users/' + currentUser.uid).update({
        name: userName,
        balance: appState.balance || 0,
        lastOnline: firebase.database.ServerValue.TIMESTAMP,
        online: true
    });
    
    db.ref('users/' + currentUser.uid + '/online').onDisconnect().set(false);
}

// ==========================================
// OVERRIDE PLAY GAME FOR ONLINE
// ==========================================
const originalPlayGame = window.playGame;

window.playGame = function() {
    if (!db || !currentUser) {
        showToast("Connecting...");
        initFirebaseOnline();
        
        setTimeout(() => {
            if (db && currentUser) {
                startOnlineMatch();
            } else {
                showToast("Playing Offline");
                startMatchmaking();
            }
        }, 2000);
        return;
    }
    
    startOnlineMatch();
};

// ==========================================
// ONLINE MATCHMAKING
// ==========================================
function startOnlineMatch() {
    onlineBetAmount = currentBet || 100;
    
    if (appState.balance < onlineBetAmount) {
        showToast("Insufficient Balance!");
        return;
    }
    
    // Deduct bet
    appState.balance -= onlineBetAmount;
    saveState();
    
    // Show matchmaking screen
    showScreen('screen-matchmaking');
    
    const entryEl = document.getElementById('matchmaking-entry');
    if (entryEl) entryEl.innerText = onlineBetAmount;
    
    findOpponent();
}

function findOpponent() {
    const userName = localStorage.getItem('ludo_user_name') || 'Player';
    const oddhavatar = 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + currentUser.uid;
    
    // Add to queue
    const myQueueRef = db.ref('matchmaking/' + onlineBetAmount + '/' + currentUser.uid);
    
    myQueueRef.set({
        name: userName,
        oddhavatar: oddhavatar,
        oddhbet: onlineBetAmount,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Listen for opponents
    const queueRef = db.ref('matchmaking/' + onlineBetAmount);
    
    queueRef.on('value', function(snapshot) {
        const players = snapshot.val();
        if (!players) return;
        
        const playerIds = Object.keys(players);
        
        if (playerIds.length >= 2 && playerIds.includes(currentUser.uid)) {
            const opponentId = playerIds.find(function(id) {
                return id !== currentUser.uid;
            });
            
            if (opponentId) {
                queueRef.off();
                myQueueRef.remove();
                
                const opponentInfo = players[opponentId];
                showOpponentFound(opponentInfo.name);
                
                setTimeout(function() {
                    createGameRoom(currentUser.uid, opponentId, onlineBetAmount);
                }, 2000);
            }
        }
    });
    
    // Timer (60 sec)
    startMatchTimer(60, myQueueRef, queueRef);
    
    // Avatar animation
    startAvatarAnimation();
}

function startMatchTimer(seconds, myQueueRef, queueRef) {
    let timeLeft = seconds;
    const timerEl = document.getElementById('timer');
    
    if (window.matchInterval) clearInterval(window.matchInterval);
    
    window.matchInterval = setInterval(function() {
        timeLeft--;
        if (timerEl) timerEl.innerText = timeLeft < 10 ? '0' + timeLeft : timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(window.matchInterval);
            clearInterval(window.avatarInterval);
            
            queueRef.off();
            myQueueRef.remove();
            
            playWithAI();
        }
    }, 1000);
    
    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            clearInterval(window.matchInterval);
            clearInterval(window.avatarInterval);
            
            queueRef.off();
            myQueueRef.remove();
            
            appState.balance += onlineBetAmount;
            saveState();
            
            showToast("Cancelled! Refunded.");
            goToWalletDashboard();
        };
    }
}

function startAvatarAnimation() {
    if (window.avatarInterval) clearInterval(window.avatarInterval);
    
    window.avatarInterval = setInterval(function() {
        const avatarEl = document.getElementById('random-avatar-img');
        if (avatarEl) {
            const seed = Math.random().toString(36).substring(7);
            avatarEl.setAttribute('href', 'https://api.dicebear.com/9.x/avataaars/svg?seed=' + seed);
        }
    }, 300);
}

function showOpponentFound(name) {
    clearInterval(window.avatarInterval);
    
    const oppText = document.getElementById('opponent-name-text');
    if (oppText) {
        oppText.innerText = name;
        oppText.setAttribute('fill', '#000');
    }
    
    showToast("Opponent Found!");
}

function playWithAI() {
    const aiNames = ["Rayhan", "Faruk", "Arman", "Rahul", "Sani", "Rashed"];
    const aiName = aiNames[Math.floor(Math.random() * aiNames.length)];
    
    showOpponentFound(aiName);
    
    setTimeout(function() {
        isOnlineGame = false;
        startGame('vsAI', 2);
        showScreen('game-screen');
    }, 2000);
}

// ==========================================
// CREATE GAME ROOM
// ==========================================
function createGameRoom(myId, oddhId, betAmount) {
    const roomId = db.ref('games').push().key;
    
    const isYellow = myId < oddhId;
    myPlayerColor = isYellow ? 'yellow' : 'red';
    
    const winPrize = Math.floor(betAmount * 2 * 0.95);
    
    const gameData = {
        roomId: roomId,
        bet: betAmount,
        prize: winPrize,
        status: 'playing',
        created: firebase.database.ServerValue.TIMESTAMP,
        players: {
            yellow: isYellow ? myId : oddhId,
            red: isYellow ? oddhId : myId
        },
        turn: 'yellow',
        dice: 0,
        board: {
            yellow: [-1, -1, -1, -1],
            red: [-1, -1, -1, -1]
        }
    };
    
    db.ref('games/' + roomId).set(gameData);
    
    db.ref('matchmaking/' + betAmount + '/' + myId).remove();
    db.ref('matchmaking/' + betAmount + '/' + oddhId).remove();
    
    currentRoomId = roomId;
    currentRoomRef = db.ref('games/' + roomId);
    isOnlineGame = true;
    
    setTimeout(function() {
        startOnlineGame(roomId);
    }, 1000);
}

// ==========================================
// ONLINE GAME
// ==========================================
function startOnlineGame(roomId) {
    isOnlineGame = true;
    gameMode = 'online';
    players = ['yellow', 'red'];
    
    boardState = {};
    players.forEach(function(p) {
        boardState[p] = [];
        for (var i = 0; i < 4; i++) {
            boardState[p].push({
                id: i,
                pos: -1,
                status: 'base',
                justSpawned: false
            });
        }
    });
    
    showScreen('game-screen');
    initBoard();
    createPlayerHubs();
    drawTokens();
    
    currentRoomRef.on('value', function(snapshot) {
        if (!snapshot.exists()) {
            handleDisconnect();
            return;
        }
        
        var data = snapshot.val();
        updateOnlineGame(data);
    });
    
    playerTurnIndex = 0;
    updateTurnUI();
}

function updateOnlineGame(data) {
    if (!data || !isOnlineGame) return;
    
    // Check winner
    if (data.status === 'finished' && data.winner) {
        handleWinner(data.winner, data.prize);
        return;
    }
    
    // Update dice
    if (data.dice && data.dice > 0) {
        diceValue = data.dice;
        var diceEl = document.getElementById('dice-' + data.turn);
        if (diceEl) {
            diceEl.innerHTML = createDiceSVG(diceValue, data.turn);
        }
    }
    
    // Update board
    if (data.board) {
        ['yellow', 'red'].forEach(function(color) {
            if (data.board[color]) {
                for (var i = 0; i < 4; i++) {
                    var pos = data.board[color][i];
                    if (boardState[color] && boardState[color][i]) {
                        if (pos === -1) {
                            boardState[color][i].status = 'base';
                            boardState[color][i].pos = -1;
                        } else {
                            boardState[color][i].status = 'track';
                            boardState[color][i].pos = pos;
                        }
                    }
                }
            }
        });
        drawTokens();
    }
    
    // Update turn
    if (data.turn) {
        playerTurnIndex = data.turn === 'yellow' ? 0 : 1;
        updateTurnUI();
        
        var isMyTurn = (data.turn === myPlayerColor);
        var myDice = document.getElementById('dice-' + myPlayerColor);
        if (myDice) {
            myDice.style.pointerEvents = isMyTurn ? 'auto' : 'none';
        }
    }
}

// Override handleRoll for online
var origHandleRoll = window.handleRoll;

window.handleRoll = function(color) {
    if (isOnlineGame) {
        if (color !== myPlayerColor) return;
        
        var dice = Math.floor(Math.random() * 6) + 1;
        
        currentRoomRef.update({
            dice: dice
        });
        
        diceValue = dice;
        performRoll();
    } else if (origHandleRoll) {
        origHandleRoll(color);
    }
};

// Override moveToken for online
var origMoveToken = window.moveToken;

window.moveToken = function(color, tokenId) {
    if (isOnlineGame) {
        if (color !== myPlayerColor) return;
        
        currentRoomRef.once('value').then(function(snapshot) {
            var data = snapshot.val();
            if (!data || !data.board) return;
            
            var board = JSON.parse(JSON.stringify(data.board));
            var pos = board[color][tokenId];
            
            if (pos === -1 && diceValue === 6) {
                board[color][tokenId] = 0;
            } else if (pos >= 0) {
                board[color][tokenId] = Math.min(pos + diceValue, 56);
            }
            
            // Check win
            var allFinished = true;
            for (var i = 0; i < 4; i++) {
                if (board[color][i] !== 56) {
                    allFinished = false;
                    break;
                }
            }
            
            var nextTurn = color;
            if (diceValue !== 6 && !allFinished) {
                nextTurn = color === 'yellow' ? 'red' : 'yellow';
            }
            
            currentRoomRef.update({
                board: board,
                turn: nextTurn,
                dice: 0,
                status: allFinished ? 'finished' : 'playing',
                winner: allFinished ? color : null
            });
            
            if (origMoveToken) {
                origMoveToken(color, tokenId);
            }
        });
    } else if (origMoveToken) {
        origMoveToken(color, tokenId);
    }
};

// Handle winner
function handleWinner(winner, prize) {
    isOnlineGame = false;
    
    if (currentRoomRef) {
        currentRoomRef.off();
        currentRoomRef = null;
    }
    
    if (winner === myPlayerColor) {
        appState.balance += prize;
        appState.wins++;
        addTransaction('game_win', prize, 'success', 'Online Win +' + prize);
        
        document.getElementById('win-title').innerText = "🎉 YOU WON!";
        document.getElementById('win-message').innerText = "You won " + prize + " coins!";
    } else {
        appState.losses++;
        addTransaction('game_loss', onlineBetAmount, 'success', 'Online Loss -' + onlineBetAmount);
        
        document.getElementById('win-title').innerText = "😢 YOU LOST";
        document.getElementById('win-message').innerText = "Better luck next time!";
    }
    
    saveState();
    document.getElementById('win-modal').style.display = 'flex';
}

// Handle disconnect
function handleDisconnect() {
    isOnlineGame = false;
    
    if (currentRoomRef) {
        currentRoomRef.off();
        currentRoomRef = null;
    }
    
    appState.balance += onlineBetAmount;
    saveState();
    
    showToast("Opponent left! Refunded.");
    
    setTimeout(function() {
        document.getElementById('win-modal').style.display = 'none';
        goToWalletDashboard();
    }, 2000);
}

// ==========================================
// INITIALIZE
// ==========================================
window.addEventListener('load', function() {
    console.log("🎮 Online Module Loading...");
    
    setTimeout(function() {
        initFirebaseOnline();
    }, 1500);
});

console.log("✅ Online Multiplayer Module Ready!");