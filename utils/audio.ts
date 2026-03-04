
export const startRecording = async (): Promise<{ stream: MediaStream; recorder: MediaRecorder }> => {
  try {
    // Check if the environment supports mediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Microphone access is not supported in this environment.");
    }

    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Use standard MediaRecorder
    const recorder = new MediaRecorder(stream);
    
    return { stream, recorder };
  } catch (error: any) {
    console.error("Microphone Error:", error);
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error("Microphone permission denied. Please enable it in Telegram settings.");
    }
    throw error;
  }
};

export const stopRecording = (stream: MediaStream, recorder: MediaRecorder): Promise<Blob> => {
  return new Promise((resolve) => {
    const chunks: BlobPart[] = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      // Stop all tracks to release the microphone
      stream.getTracks().forEach(track => track.stop());
      resolve(blob);
    };
    
    recorder.stop();
  });
};
