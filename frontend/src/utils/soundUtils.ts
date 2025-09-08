// Sound utilities for notification sounds
// Uses Web Audio API to generate notification sounds

export class SoundUtils {
    private static audioContext: AudioContext | null = null;

    // Initialize audio context (required for Web Audio API)
    private static getAudioContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    // Play a simple notification beep sound
    static async playNotificationSound(): Promise<void> {
        try {
            const audioContext = this.getAudioContext();

            // Resume audio context if it's suspended (required by some browsers)
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Create oscillator for the beep sound
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Configure the sound
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz frequency
            oscillator.type = 'sine';

            // Configure volume envelope (fade in/out)
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            // Play the sound
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);

            console.log('🔊 Notification sound played');
        } catch (error) {
            console.error('Error playing notification sound:', error);
            // Fallback: try to play a simple beep using HTML5 Audio
            this.playFallbackSound();
        }
    }

    // Fallback sound using HTML5 Audio (for browsers that don't support Web Audio API)
    private static playFallbackSound(): void {
        try {
            // Create a data URL for a simple beep sound
            const audioData = this.generateBeepDataURL();
            const audio = new Audio(audioData);
            audio.volume = 0.3;
            audio.play().catch(error => {
                console.error('Fallback sound failed:', error);
            });
        } catch (error) {
            console.error('Fallback sound creation failed:', error);
        }
    }

    // Generate a simple beep sound as data URL
    private static generateBeepDataURL(): string {
        // This creates a very short beep sound using Web Audio API and converts it to data URL
        // For simplicity, we'll use a basic approach
        const sampleRate = 44100;
        const duration = 0.3;
        const frequency = 800;
        const samples = Math.floor(sampleRate * duration);
        const buffer = new ArrayBuffer(44 + samples * 2);
        const view = new DataView(buffer);

        // WAV header
        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples * 2, true);

        // Generate sine wave
        for (let i = 0; i < samples; i++) {
            const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
            view.setInt16(44 + i * 2, sample * 32767, true);
        }

        const blob = new Blob([buffer], { type: 'audio/wav' });
        return URL.createObjectURL(blob);
    }

    // Play a different sound for different notification types
    static async playNotificationSoundByType(type: string): Promise<void> {
        switch (type) {
            case 'new_post':
                await this.playNotificationSound();
                break;
            case 'message':
                await this.playMessageSound();
                break;
            case 'claim':
                await this.playClaimSound();
                break;
            default:
                await this.playNotificationSound();
        }
    }

    // Play a message notification sound (slightly different frequency)
    static async playMessageSound(): Promise<void> {
        try {
            const audioContext = this.getAudioContext();

            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Different frequency for messages (600Hz)
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.25);

            console.log('🔊 Message notification sound played');
        } catch (error) {
            console.error('Error playing message sound:', error);
            this.playFallbackSound();
        }
    }

    // Play a claim notification sound (different pattern)
    static async playClaimSound(): Promise<void> {
        try {
            const audioContext = this.getAudioContext();

            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Play two quick beeps for claim notifications
            for (let i = 0; i < 2; i++) {
                setTimeout(async () => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                    oscillator.type = 'sine';

                    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.15);
                }, i * 200);
            }

            console.log('🔊 Claim notification sound played');
        } catch (error) {
            console.error('Error playing claim sound:', error);
            this.playFallbackSound();
        }
    }
}
