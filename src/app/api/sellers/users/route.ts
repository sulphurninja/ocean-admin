import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import connectDB from '@/lib/mongoose';
import { requireSeller } from '@/lib/auth';
import mongoose from 'mongoose';

// Validation schema
const userSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  planDays: z.number().min(1).default(30)
});

export async function POST(req: NextRequest) {
  const seller = await requireSeller(req);
  if (seller instanceof NextResponse) return seller;

  await connectDB();

  try {
    const body = await req.json();
    const validation = userSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.flatten()
      }, { status: 400 });
    }

    const { username, password, planDays } = validation.data;

    // Check if seller has enough balance
    const chargeAmount = seller.userCreationCharge || 0;
    const currentBalance = seller.wallet?.balance || 0;

    // If wallet balance is insufficient, prevent user creation
    if (currentBalance < chargeAmount) {
      return NextResponse.json(
        {
          error: 'Insufficient wallet balance',
          required: chargeAmount,
          current: currentBalance,
          shortage: chargeAmount - currentBalance
        },
        { status: 400 }
      );
    }

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
    initialExpiry.setDate(initialExpiry.getDate() + planDays);

    // Instead of using User.create, directly insert into MongoDB
    const usersCollection = mongoose.connection.collection('users');

    const result = await usersCollection.insertOne({
      subs_credentials: {
        user_name: username,
        password: hashedPassword
      },
      // Add this field to satisfy the unique index constraint
      username: username,
      plan_expiry: initialExpiry,
      role: 'user',
      createdBy: new mongoose.Types.ObjectId(seller._id),
      devices: [],
      createdAt: new Date()
    });

    // Get the inserted user
    const user = await User.findById(result.insertedId);

    // Update seller's wallet and user list
    seller.wallet.balance -= chargeAmount;
    seller.wallet.transactions.push({
      amount: -chargeAmount,
      description: `User creation: ${username}`,
      createdAt: new Date()
    });

    if (!seller.createdUsers) {
      seller.createdUsers = [];
    }
    seller.createdUsers.push(user._id);

    await seller.save();

    return NextResponse.json({
      _id: user._id,
      username: user.subs_credentials.user_name,
      plan_expiry: user.plan_expiry,
      walletBalanceAfter: seller.wallet.balance
    });

  } catch (error) {
    console.error('User creation error:', error);

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
  const seller = await requireSeller(req);
  if (seller instanceof NextResponse) return seller;

  await connectDB();

  try {
    // Find users created by this seller
    const users = await User.find({ createdBy: seller._id })
      .select('-subs_credentials.password -__v')
      .lean();

    return NextResponse.json(users.map(user => ({
      _id: user._id,
      username: user.subs_credentials.user_name,
      plan_expiry: user.plan_expiry?.toISOString(),
      devices: user.devices,
      created_at: user.createdAt.toISOString()
    })));

  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
