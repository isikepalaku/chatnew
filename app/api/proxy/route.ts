// app/api/proxy/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Extract data from request body
    const { question, history, overrideConfig } = await request.json();

    // Get environment variables
    const apiEndpoint = process.env.ZEP_API_ENDPOINT;
    const apiToken = process.env.ZEP_API_TOKEN;

    // Validate environment variables
    if (!apiEndpoint || !apiToken) {
      console.error('Missing API configuration:', { apiEndpoint: !!apiEndpoint, apiToken: !!apiToken });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!overrideConfig?.sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Make request to prediction API
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

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      return NextResponse.json(
        { error: 'Error from prediction API' },
        { status: response.status }
      );
    }

    // Parse the response
    const data = await response.json();

    // Validate response data
    if (!data.text && !data.reply) {
      console.error('Invalid API response format:', data);
      return NextResponse.json(
        { error: 'Invalid response format from API' },
        { status: 500 }
      );
    }

    // Return the response
    return NextResponse.json({
      reply: data.text || data.reply
    });

  } catch (error) {
    // Log the error
    console.error('Error in API route:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
