/**
 * StreamVault Watch Together - Popup Script
 * Handles UI interactions for the extension popup
 */

// Elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const connectForm = document.getElementById('connectForm');
const connectedView = document.getElementById('connectedView');
const roomCodeInput = document.getElementById('roomCode');
const isHostCheckbox = document.getElementById('isHost');
const joinBtn = document.getElementById('joinBtn');
const leaveBtn = document.getElementById('leaveBtn');
const currentRoomInput = document.getElementById('currentRoom');

// Update UI based on connection status
function updateUI(connected, roomCode = null) {
    if (connected) {
        statusDot.classList.add('connected');
        statusText.classList.add('connected');
        statusText.textContent = 'Connected';
        connectForm.classList.add('hidden');
        connectedView.classList.remove('hidden');
        currentRoomInput.value = roomCode || '';
    } else {
        statusDot.classList.remove('connected');
        statusText.classList.remove('connected');
        statusText.textContent = 'Disconnected';
        connectForm.classList.remove('hidden');
        connectedView.classList.add('hidden');
    }
}

// Check current status on popup open
async function checkStatus() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
        updateUI(response.connected, response.roomCode);
    } catch (e) {
        console.error('Failed to get status:', e);
    }
}

// Join room
async function joinRoom() {
    const roomCode = roomCodeInput.value.trim();
    if (!roomCode) {
        alert('Please enter a room code');
        return;
    }

    joinBtn.disabled = true;
    joinBtn.textContent = 'Connecting...';

    try {
        // Determine server URL based on current tab
        const serverUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:5000'
            : 'https://streamvault.live';

        const isHost = isHostCheckbox.checked;

        await chrome.runtime.sendMessage({
            type: 'JOIN_ROOM',
            roomCode: roomCode,
            isHost: isHost
        });

        // Save last room code
        chrome.storage.local.set({ lastRoomCode: roomCode });

        // Save host status
        chrome.storage.local.set({ isHost: isHost });

        // Notify content scripts about host status
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'SET_HOST', isHost: isHost }).catch(() => { });
            }
        });

        // Wait a bit then check status
        setTimeout(checkStatus, 1000);

    } catch (e) {
        console.error('Failed to join:', e);
        alert('Failed to connect. Make sure the room code is correct.');
    }

    joinBtn.disabled = false;
    joinBtn.textContent = 'Join Room';
}

// Leave room
async function leaveRoom() {
    try {
        await chrome.runtime.sendMessage({ type: 'LEAVE_ROOM' });
        updateUI(false);
    } catch (e) {
        console.error('Failed to leave:', e);
    }
}

// Load saved settings
async function loadSettings() {
    try {
        const data = await chrome.storage.local.get(['lastRoomCode', 'isHost']);
        if (data.lastRoomCode) {
            roomCodeInput.value = data.lastRoomCode;
        }
        if (data.isHost !== undefined) {
            isHostCheckbox.checked = data.isHost;
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
}

// Event listeners
joinBtn.addEventListener('click', joinRoom);
leaveBtn.addEventListener('click', leaveRoom);

roomCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinRoom();
    }
});

// Initialize
loadSettings();
checkStatus();
