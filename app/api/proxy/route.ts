// app/api/proxy/route.ts
import { NextResponse } from 'next/server';

interface PredictionResponse {
  text: string;
  // Add other expected response fields
}

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

    // Log request for debugging
    console.log('Sending request to API:', {
      endpoint: apiEndpoint,
      questionLength: question?.length,
      historyLength: history?.length,
      sessionId: overrideConfig?.sessionId
    });

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
          sessionId: overrideConfig?.sessionId,
          returnSourceDocuments: overrideConfig?.returnSourceDocuments || false,
        },
      }),
    });

    // Log response status for debugging
    console.log('API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      return NextResponse.json(
        { 
          error: 'Error from prediction API',
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Log successful response for debugging
    console.log('API response data structure:', Object.keys(data));

    // Check if the response has the expected structure
    if (!data.text && !data.reply) {
      console.error('Invalid API response format:', data);
      return NextResponse.json(
        { error: 'Invalid response format from API' },
        { status: 500 }
      );
    }

    // Return the response text
    return NextResponse.json({
      reply: data.text || data.reply
    });

  } catch (error) {
    // Enhanced error logging
    console.error('Detailed error information:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
