interface AudioRecorder {
  stream: MediaStream | null;
  recorder: MediaRecorder | null;
  blobs: Blob[];
  start(): Promise<boolean>;
  stop(): Promise<File | undefined>;
}

export const audio: AudioRecorder = {
  stream: null,
  recorder: null,
  blobs: [],
  start: async () => {
    return navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        audio.stream = stream;
        audio.blobs = [];
        audio.recorder = new MediaRecorder(stream);
        audio.recorder.ondataavailable = (event) => {
          audio.blobs.push(event.data);
        };

        audio.recorder.start();
        return true;
      })
      .catch((e) => {
        return false;
      });
  },
  stop: async () => {
    const { recorder, stream, blobs } = audio;

    if (!recorder || !stream) return;

    try {
      return new Promise((resolve) => {
        recorder.onstop = () => {
          let audioBlob = new Blob(blobs, {
            type: "audio/mp3",
          });
          const audioFile = new File([audioBlob], "filename.mp3");

          audio.recorder = null;
          audio.stream = null;
          resolve(audioFile);
        };

        setTimeout(() => {
          recorder.stop();
          stream.getTracks().forEach((track) => track.stop());
        }, 300);
      });
    } catch (e) {
      return undefined;
    }
  },
};
