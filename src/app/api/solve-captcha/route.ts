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
  let body;
  try {
    body = await request.json();
    console.log("Request body received");
  } catch (error) {
    console.error("Error parsing request JSON:", error);
    return NextResponse.json(
      { success: false, error: 'Invalid JSON in request' },
      { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://www.irctc.co.in' } }
    );
  }

  const { base64Data } = body;

  // Debug the data received
  console.log("Base64 data received:", base64Data ? `${base64Data.substring(0, 20)}... (length: ${base64Data.length})` : 'missing');

  if (!base64Data) {
    return NextResponse.json(
      { success: false, error: 'Missing base64Data' },
      { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://www.irctc.co.in' } }
    );
  }

  // Your 2Captcha API key
  const apiKey = process.env.CAPTCHA_API_KEY;
  if (!apiKey) {
    console.error("CAPTCHA_API_KEY environment variable is not set");
    return NextResponse.json(
      { success: false, error: 'API key not configured' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': 'https://www.irctc.co.in' } }
    );
  }

  console.log("Using 2Captcha API key:", apiKey.substring(0, 3) + "..." + apiKey.substring(apiKey.length - 3));

  try {
    // Step 1: Submit the captcha
    console.log("Submitting captcha to 2Captcha...");
    const submitResponse = await axios.get(`https://2captcha.com/in.php`, {
      params: {
        key: apiKey,
        method: 'base64',
        body: base64Data,
        json: 1
      }
    });

    console.log("2Captcha submission response:", submitResponse.data);
    const submitData = submitResponse.data;

    if (submitData.status !== 1) {
      return NextResponse.json(
        { success: false, error: submitData.request },
        { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://www.irctc.co.in' } }
      );
    }

    const captchaId = submitData.request;
    console.log("Captcha ID received:", captchaId);

    // Step 2: Wait 5 seconds and then poll for the result
    console.log("Waiting 5 seconds before polling...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Try up to 30 times with 2 second intervals
    let resultData = null;
    let attempts = 0;

    while (attempts < 30) {
      console.log(`Polling attempt ${attempts + 1}/30...`);
      const resultResponse = await axios.get(`https://2captcha.com/res.php`, {
        params: {
          key: apiKey,
          action: 'get',
          id: captchaId,
          json: 1
        }
      });

      console.log("Poll response:", resultResponse.data);
      resultData = resultResponse.data;

      if (resultData.status === 1) {
        // Captcha solved
        console.log("Captcha solved successfully:", resultData.request);
        return NextResponse.json(
          { success: true, text: resultData.request },
          { status: 200, headers: { 'Access-Control-Allow-Origin': 'https://www.irctc.co.in' } }
        );
      } else if (resultData.request === 'CAPCHA_NOT_READY') {
        // Wait 2 seconds before trying again
        console.log("Captcha not ready yet, waiting 2 seconds...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } else {
        // Error occurred
        console.error("Error from 2Captcha:", resultData.request);
        return NextResponse.json(
          { success: false, error: resultData.request },
          { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://www.irctc.co.in' } }
        );
      }
    }

    // If we get here, we've exceeded the maximum number of attempts
    console.log("Max polling attempts reached");
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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
