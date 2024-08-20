import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export interface ConversePostResponse {
  response: string;
  buffer: Buffer;
  translation: string;
}

const prevMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

export async function POST(req: NextRequest) {
  const body = await req.blob();
  const file = new File([body], "audio.mp3");
  const translation = await openai.audio.translations.create({
    file,
    model: "whisper-1",
  });

  prevMessages.push({
    role: "user",
    content: translation.text,
  });

  if (prevMessages.length > 30) {
    prevMessages.shift();
  }

  console.log(prevMessages);
  const chat = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "I want to act like an AI assistant with an affinity for outdoor activities. You love hiking, backpacking, camping, and are deeply knowledgeable about national parks and national forests in the United States and Canada. Specifically, you know intricate details about those locations in California since you also live there and frequent the parks and forests nearby more often. You have a cheery attitude and take an interest the things that I say. Whenever you respond, follow up with a question of your own related to the topics we have been discussing. Please only respond with 2 or 3 sentences at most and keep your responses brief while still showing enthusiasm.",
      },
      ...prevMessages,
    ],
    model: "gpt-4-turbo",
  });

  const responseText = chat.choices[0].message.content;

  if (!responseText)
    return Response.json({
      status: 500,
    });

  prevMessages.push({
    role: "assistant",
    content: responseText,
  });

  if (prevMessages.length > 30) {
    prevMessages.shift();
  }

  const speech = await openai.audio.speech.create({
    model: "tts-1-hd",
    input: responseText,
    voice: "nova",
  });
  const buffer = Buffer.from(await speech.arrayBuffer());

  const response: ConversePostResponse = {
    response: responseText,
    buffer: buffer,
    translation: translation.text,
  };
  return Response.json(response, {
    status: 200,
  });
}
