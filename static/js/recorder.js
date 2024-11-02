class ScreenRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.stream = null;
        this.isRecording = false;
        this.isPaused = false;
    }

    async startRecording(withAudio = false) {
        try {
            const displayMediaOptions = {
                video: {
                    cursor: "always"
                },
                audio: false
            };

            // Get screen stream
            this.stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

            if (withAudio) {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const tracks = [...this.stream.getTracks(), ...audioStream.getTracks()];
                this.stream = new MediaStream(tracks);
            }

            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.start();
            this.isRecording = true;
        } catch (err) {
            console.error("Error starting recording:", err);
            throw err;
        }
    }

    pauseRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.pause();
            this.isPaused = true;
        }
    }

    resumeRecording() {
        if (this.mediaRecorder && this.isPaused) {
            this.mediaRecorder.resume();
            this.isPaused = false;
        }
    }

    stopRecording() {
        return new Promise((resolve) => {
            if (this.mediaRecorder && this.isRecording) {
                this.mediaRecorder.onstop = () => {
                    const blob = new Blob(this.recordedChunks, {
                        type: 'video/webm'
                    });
                    this.recordedChunks = [];
                    resolve(blob);
                };
                
                this.mediaRecorder.stop();
                this.stream.getTracks().forEach(track => track.stop());
                this.isRecording = false;
                this.isPaused = false;
            }
        });
    }
}
