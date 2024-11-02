const screenRecorder = new ScreenRecorder();

// UI Elements
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const audioToggle = document.getElementById('audioToggle');
const preview = document.getElementById('preview');
const recordingPreview = document.getElementById('recordingPreview');
const saveBtn = document.getElementById('saveBtn');

// Event Listeners
startBtn.addEventListener('click', startRecording);
pauseBtn.addEventListener('click', togglePause);
stopBtn.addEventListener('click', stopRecording);
saveBtn.addEventListener('click', saveRecording);

let recordingBlob = null;

async function startRecording() {
    try {
        await screenRecorder.startRecording(audioToggle.checked);
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        preview.classList.add('d-none');
    } catch (err) {
        alert('Failed to start recording: ' + err.message);
    }
}

function togglePause() {
    if (screenRecorder.isPaused) {
        screenRecorder.resumeRecording();
        pauseBtn.innerHTML = '<i class="fas fa-pause me-2"></i>Pause';
    } else {
        screenRecorder.pauseRecording();
        pauseBtn.innerHTML = '<i class="fas fa-play me-2"></i>Resume';
    }
}

async function stopRecording() {
    recordingBlob = await screenRecorder.stopRecording();
    
    // Reset UI
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    
    // Show preview
    recordingPreview.src = URL.createObjectURL(recordingBlob);
    preview.classList.remove('d-none');
}

async function saveRecording() {
    if (!recordingBlob) return;

    const formData = new FormData();
    formData.append('video', recordingBlob, 'recording.webm');

    try {
        const response = await fetch('/save-recording', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            location.reload(); // Refresh to show new recording
        } else {
            throw new Error('Failed to save recording');
        }
    } catch (err) {
        alert('Error saving recording: ' + err.message);
    }
}

async function deleteRecording(recordingId) {
    if (!confirm('Are you sure you want to delete this recording?')) return;

    try {
        const response = await fetch(`/delete/${recordingId}`, {
            method: 'POST'
        });

        if (response.ok) {
            location.reload();
        } else {
            throw new Error('Failed to delete recording');
        }
    } catch (err) {
        alert('Error deleting recording: ' + err.message);
    }
}
