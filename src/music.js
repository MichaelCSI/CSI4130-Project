var currentAudio = null;
const audioFiles = [
    "./audio/lofi-piano-beat-305563.mp3",
    "./audio/lofi-295209.mp3",
    "./audio/lofi-background-music-309034.mp3"
];

export async function toggleAudio(volumeElement) {

    // Pause
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        volumeElement.classList.remove('fa-volume-high');
        volumeElement.classList.add('fa-volume-xmark');
        return;
    }

    // Play (and loop indefinitely)
    volumeElement.classList.remove('fa-volume-xmark');
    volumeElement.classList.add('fa-volume-high');
    while (true) {
        for (const file of audioFiles) {
            await playAudio(file);
        }
    }
};
    
// Async audio function to resolve when audio ends to play them sequentially
function playAudio(file) {
    return new Promise((resolve) => {
        currentAudio = new Audio(file);
        currentAudio.onended = resolve;
        currentAudio.play().catch(error => {
            console.error(`Error playing ${file}:`, error);
            resolve();
        });
    });
} 