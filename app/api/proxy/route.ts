import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { question, history, overrideConfig } = await request.json();
    const apiEndpoint = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/c31ac883-a580-43ad-ada0-198cb2202b6b`;
    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;

    if (!overrideConfig?.sessionId) {
      console.error('Session ID is missing');
      return NextResponse.json({ reply: 'Session ID is required.' }, { status: 400 });
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        question,
        history,
        overrideConfig: {
          sessionId: overrideConfig.sessionId,
          returnSourceDocuments: overrideConfig.returnSourceDocuments || false,
        },
      }),
    });

    if (!response.ok) {
      console.error('API error:', response.status, await response.text());
      return NextResponse.json({ reply: 'Error communicating with Flowise API' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ reply: data.text || "No response from API" });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ reply: 'An unexpected error occurred.' }, { status: 500 });
  }
}
