import { NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongoose';
import { z } from 'zod';

// Validation schema
const adminSetupSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  setupKey: z.string()
});

export async function POST(req: Request) {
  await connectDB();

  try {
    const body = await req.json();
    const validation = adminSetupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.flatten()
      }, { status: 400 });
    }

    const { username, password, setupKey } = validation.data;

    // Verify the setup key from environment variable
    const correctSetupKey = process.env.ADMIN_SETUP_KEY;

    if (!correctSetupKey || setupKey !== correctSetupKey) {
      return NextResponse.json(
        { error: 'Invalid setup key' },
        { status: 403 }
      );
    }

    // Check if any admin already exists
    const adminExists = await User.findOne({
      $or: [
        { role: 'admin' },
        { isAdmin: true }
      ]
    });

    if (adminExists) {
      return NextResponse.json(
        { error: 'Admin account already exists' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const userExists = await User.findOne({
      'subs_credentials.user_name': username
    });

    if (userExists) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin user
    const admin = await User.create({
      subs_credentials: {
        user_name: username,
        password: hashedPassword
      },
      username: username,
      role: 'admin',
      isAdmin: true,
      plan_expiry: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years
      devices: [],
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully'
    });

  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
