import { NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/mongoose';

export async function GET() {
  await connectDB();

  try {
    // Check if any admin already exists
    const adminExists = await User.findOne({
      $or: [
        { role: 'admin' },
        { isAdmin: true }
      ]
    });

    return NextResponse.json({
      setupNeeded: !adminExists
    });

  } catch (error) {
    console.error('Setup status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
