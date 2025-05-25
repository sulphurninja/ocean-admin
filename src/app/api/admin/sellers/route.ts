import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import connectDB from '@/lib/mongoose';
import { requireAdmin } from '@/lib/auth';
import mongoose from 'mongoose';

// Validation schema
const sellerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  userCreationCharge: z.number().min(0).default(0),
  initialBalance: z.number().min(0).default(0)
});

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  await connectDB();

  try {
    const body = await req.json();
    const validation = sellerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.flatten()
      }, { status: 400 });
    }

    const { username, password, userCreationCharge, initialBalance } = validation.data;

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
    initialExpiry.setFullYear(initialExpiry.getFullYear() + 10); // 10 years for sellers

    // Instead of using User.create, directly insert into MongoDB with the required fields
    const usersCollection = mongoose.connection.collection('users');

    const result = await usersCollection.insertOne({
      subs_credentials: {
        user_name: username,
        password: hashedPassword
      },
      // Add this field to satisfy the unique index constraint
      username: username,
      role: 'seller',
      plan_expiry: initialExpiry,
      userCreationCharge,
      wallet: {
        balance: initialBalance,
        transactions: initialBalance > 0 ? [
          { amount: initialBalance, description: 'Initial balance', createdAt: new Date() }
        ] : []
      },
      devices: [],
      createdUsers: [],
      createdAt: new Date()
    });

    // Fetch the created seller to return
    const seller = await User.findById(result.insertedId);

    return NextResponse.json({
      _id: seller._id,
      username: seller.subs_credentials.user_name,
      userCreationCharge: seller.userCreationCharge,
      wallet: seller.wallet
    });

  } catch (error) {
    console.error('Seller creation error:', error);

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
    const sellers = await User.find({ role: 'seller' })
      .select('-subs_credentials.password -__v')
      .lean();

    return NextResponse.json(sellers.map(seller => ({
      _id: seller._id,
      username: seller.subs_credentials.user_name,
      userCreationCharge: seller.userCreationCharge,
      wallet: seller.wallet,
      createdUsers: seller.createdUsers?.length || 0,
      created_at: seller.createdAt.toISOString()
    })));

  } catch (error) {
    console.error('Sellers fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
