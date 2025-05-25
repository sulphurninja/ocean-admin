import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import connectDB from '@/lib/mongoose';
import { requireAdmin } from '@/lib/auth';
import mongoose from 'mongoose';

// Validation schema
const subadminSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  initialBalance: z.number().min(0).default(0)
});

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  await connectDB();

  try {
    const body = await req.json();
    const validation = subadminSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.flatten()
      }, { status: 400 });
    }

    const { username, password, initialBalance } = validation.data;

    // Check if user already exists
    const exists = await User.findOne({
      'subs_credentials.user_name': username
    });

    if (exists) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const initialExpiry = new Date();
    initialExpiry.setFullYear(initialExpiry.getFullYear() + 10); // 10 years for subadmins

    // Insert into MongoDB
    const usersCollection = mongoose.connection.collection('users');

    const result = await usersCollection.insertOne({
      subs_credentials: {
        user_name: username,
        password: hashedPassword
      },
      // Add this field to satisfy the unique index constraint
      username: username,
      role: 'subadmin',
      plan_expiry: initialExpiry,
      wallet: {
        balance: initialBalance,
        transactions: initialBalance > 0 ? [
          { amount: initialBalance, description: 'Initial balance', createdAt: new Date() }
        ] : []
      },
      devices: [],
      createdSellers: [],
      createdAt: new Date()
    });

    // Fetch the created subadmin to return
    const subadmin = await User.findById(result.insertedId);

    return NextResponse.json({
      _id: subadmin._id,
      username: subadmin.subs_credentials.user_name,
      wallet: subadmin.wallet
    });

  } catch (error) {
    console.error('Subadmin creation error:', error);

    // Specific error handling for duplicate key
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  await connectDB();

  try {
    const subadmins = await User.find({ role: 'subadmin' })
      .select('-subs_credentials.password -__v')
      .lean();

    return NextResponse.json(subadmins.map(subadmin => ({
      _id: subadmin._id,
      username: subadmin.subs_credentials.user_name,
      wallet: subadmin.wallet,
      createdSellers: subadmin.createdSellers?.length || 0,
      created_at: subadmin.createdAt.toISOString()
    })));

  } catch (error) {
    console.error('Subadmins fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
