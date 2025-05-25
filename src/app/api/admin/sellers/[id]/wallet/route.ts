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

    const seller = await User.findById(params.id);

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    if (seller.role !== 'seller') {
      return NextResponse.json(
        { error: 'User is not a seller' },
        { status: 400 }
      );
    }

    // Add transaction to wallet
    seller.wallet.transactions.push({
      amount,
      description: description || (amount >= 0 ? 'Deposit' : 'Withdrawal'),
      createdAt: new Date()
    });

    // Update balance
    seller.wallet.balance = (seller.wallet.balance || 0) + amount;

    await seller.save();

    return NextResponse.json({
      _id: seller._id,
      username: seller.subs_credentials.user_name,
      wallet: seller.wallet
    });

  } catch (error) {
    console.error('Wallet update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
