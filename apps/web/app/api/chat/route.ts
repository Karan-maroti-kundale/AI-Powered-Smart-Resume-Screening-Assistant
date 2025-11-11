import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a friendly assistant for an AI Resume Builder website. Help users politely.' },
        { role: 'user', content: message },
      ],
    });

    return NextResponse.json({
      reply: completion.choices[0].message?.content || 'Sorry, I did not understand that.',
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ reply: 'Server error. Please try again later.' });
  }
}
