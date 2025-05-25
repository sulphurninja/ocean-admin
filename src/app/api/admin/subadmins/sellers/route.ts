import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import connectDB from '@/lib/mongoose';
import mongoose from 'mongoose';

// Validation schema
const sellerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  userCreationCharge: z.number().min(0).default(0),
  initialBalance: z.number().min(0).default(0)
});

export async function POST(req: NextRequest) {
  const subadmin = await requireSubadmin(req);
  if (subadmin instanceof NextResponse) return subadmin;

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

    // Check if subadmin has enough balance
    if (subadmin.wallet.balance < initialBalance) {
      return NextResponse.json(
        {
          error: 'Insufficient wallet balance',
          required: initialBalance,
          current: subadmin.wallet.balance
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
    initialExpiry.setFullYear(initialExpiry.getFullYear() + 10); // 10 years for sellers

    // Insert into MongoDB
    const usersCollection = mongoose.connection.collection('users');

    const result = await usersCollection.insertOne({
      subs_credentials: {
        user_name: username,
        password: hashedPassword
      },
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
      createdBy: new mongoose.Types.ObjectId(subadmin._id),
      createdAt: new Date()
    });

    // Fetch the created seller
    const seller = await User.findById(result.insertedId);

    // Update subadmin's wallet and seller list
    subadmin.wallet.balance -= initialBalance;
    subadmin.wallet.transactions.push({
      amount: -initialBalance,
      description: `Seller creation: ${username}`,
      createdAt: new Date()
    });

    if (!subadmin.createdSellers) {
      subadmin.createdSellers = [];
    }
    subadmin.createdSellers.push(seller._id);

    await subadmin.save();

    return NextResponse.json({
      _id: seller._id,
      username: seller.subs_credentials.user_name,
      userCreationCharge: seller.userCreationCharge,
      wallet: seller.wallet,
      walletBalanceAfter: subadmin.wallet.balance
    });

  } catch (error) {
    console.error('Seller creation error:', error);

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
  const subadmin = await requireSubadmin(req);
  if (subadmin instanceof NextResponse) return subadmin;

  await connectDB();

  try {
    // Find sellers created by this subadmin
    const sellers = await User.find({
      role: 'seller',
      createdBy: subadmin._id
    })
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
