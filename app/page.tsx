"use client";
import { useEffect, useState } from "react";
import { audio } from "@/utils/audio";
import { MicrophoneIcon, StopIcon } from "@heroicons/react/24/solid";

export default function Home() {
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const [translations, setTranslations] = useState<
    { type: string; content: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const onRecord = async () => {
    const complete = await audio.start();
    setIsRecording(complete);
  };

  const onStop = async () => {
    const audioFile = await audio.stop();
    setIsLoading(true);

    if (!audioFile) return;
    await fetch("/api/converse", {
      method: "POST",
      body: audioFile,
    })
      .then((res) => res.json())
      .then((json) => {
        setTranslations((prev) => [
          ...prev,
          {
            type: "User",
            content: json.translation,
          },
          {
            type: "Assistant",
            content: json.response,
          },
        ]);
        const buffer = Buffer.from(json.buffer);
        const blob = new Blob([buffer], {
          type: "audio/mp3",
        });
        const audioURL = URL.createObjectURL(blob);
        setUrl(audioURL);
        setIsRecording(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    document.querySelector("audio")?.play();
  }, [url]);

  useEffect(() => {
    const keyDownEvent = (event: KeyboardEvent) => {
      if (event.key !== " ") return;
      if (isRecording) onStop();
      else onRecord();
    };

    document.addEventListener("keydown", keyDownEvent);

    return () => {
      document.removeEventListener("keydown", keyDownEvent);
    };
  }, [isRecording]);

  return (
    <main className="flex flex-col h-lvh p-4 gap-4">
      <div className="flex-grow overflow-scroll flex flex-col gap-2">
        {translations.map(({ type, content }) => (
          <>
            <span key={content}>
              <strong>{type} - </strong> {content}
              <br />
            </span>
            <hr />
          </>
        ))}
      </div>
      {url ? <audio src={url} /> : null}
      <div className="justify-center flex">
        {isRecording ? (
          <button
            type="button"
            onClick={onStop}
            disabled={isLoading}
            className="text-white bg-blue-950 rounded-full p-4 disabled:bg-gray-600"
          >
            <StopIcon className="size-8" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onRecord}
            className="text-white bg-blue-950 rounded-full p-4"
          >
            <MicrophoneIcon className="size-8" />
          </button>
        )}
      </div>
    </main>
  );
}
