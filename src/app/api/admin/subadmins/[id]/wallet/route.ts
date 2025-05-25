import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/mongoose';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  await connectDB();

  try {
    const { amount, description } = await req.json();

    if (typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Amount must be a number' },
        { status: 400 }
      );
    }

    const subadmin = await User.findById(params.id);

    if (!subadmin) {
      return NextResponse.json(
        { error: 'Subadmin not found' },
        { status: 404 }
      );
    }

    if (subadmin.role !== 'subadmin') {
      return NextResponse.json(
        { error: 'User is not a subadmin' },
        { status: 400 }
      );
    }

    // Add transaction to wallet
    subadmin.wallet.transactions.push({
      amount,
      description: description || (amount >= 0 ? 'Deposit' : 'Withdrawal'),
      createdAt: new Date()
    });

    // Update balance
    subadmin.wallet.balance = (subadmin.wallet.balance || 0) + amount;

    await subadmin.save();

    return NextResponse.json({
      _id: subadmin._id,
      username: subadmin.subs_credentials.user_name,
      wallet: subadmin.wallet
    });

  } catch (error) {
    console.error('Wallet update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
