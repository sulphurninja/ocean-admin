// app/api/solve-captcha/route.js
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Set CORS headers directly
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://www.irctc.co.in',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function POST(request: NextRequest) {
  // Get the request body
  const body = await request.json();
  const { base64Data } = body;

  if (!base64Data) {
    return NextResponse.json(
      { success: false, error: 'Missing base64Data' },
      { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://www.irctc.co.in' } }
    );
  }

  // Your 2Captcha API key
  const apiKey = process.env.CAPTCHA_API_KEY; // Store in environment variables

  try {
    // Step 1: Submit the captcha
    const submitResponse = await axios.get(`https://2captcha.com/in.php`, {
      params: {
        key: apiKey,
        method: 'base64',
        body: base64Data,
        json: 1
      }
    });

    const submitData = submitResponse.data;

    if (submitData.status !== 1) {
      return NextResponse.json(
        { success: false, error: submitData.request },
        { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://www.irctc.co.in' } }
      );
    }

    const captchaId = submitData.request;

    // Step 2: Wait 5 seconds and then poll for the result
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Try up to 30 times with 2 second intervals
    let resultData = null;
    let attempts = 0;

    while (attempts < 30) {
      const resultResponse = await axios.get(`https://2captcha.com/res.php`, {
        params: {
          key: apiKey,
          action: 'get',
          id: captchaId,
          json: 1
        }
      });

      resultData = resultResponse.data;

      if (resultData.status === 1) {
        // Captcha solved
        return NextResponse.json(
          { success: true, text: resultData.request },
          { status: 200, headers: { 'Access-Control-Allow-Origin': 'https://www.irctc.co.in' } }
        );
      } else if (resultData.request === 'CAPCHA_NOT_READY') {
        // Wait 2 seconds before trying again
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } else {
        // Error occurred
        return NextResponse.json(
          { success: false, error: resultData.request },
          { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://www.irctc.co.in' } }
        );
      }
    }

    // If we get here, we've exceeded the maximum number of attempts
    return NextResponse.json(
      { success: false, error: 'Max polling attempts reached' },
      { status: 408, headers: { 'Access-Control-Allow-Origin': 'https://www.irctc.co.in' } }
    );

  } catch (error: any) {
    console.error('Error solving captcha:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': 'https://www.irctc.co.in' } }
    );
  }
}
