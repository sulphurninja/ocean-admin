import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/mongoose';
import { requireSubadmin } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const subadmin = await requireSubadmin(req);
  if (subadmin instanceof NextResponse) return subadmin;

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

    // Verify this seller was created by this subadmin
    if (!seller.createdBy || seller.createdBy.toString() !== subadmin._id.toString()) {
      return NextResponse.json(
        { error: 'You are not authorized to manage this seller' },
        { status: 403 }
      );
    }

    // For positive amounts (adding money to seller), check subadmin's wallet balance
    if (amount > 0) {
      const subadminBalance = subadmin.wallet?.balance || 0;

      if (subadminBalance < amount) {
        return NextResponse.json(
          {
            error: 'Insufficient wallet balance',
            required: amount,
            current: subadminBalance,
            shortage: amount - subadminBalance
          },
          { status: 400 }
        );
      }

      // Deduct from subadmin's wallet
      subadmin.wallet.balance -= amount;
      subadmin.wallet.transactions.push({
        amount: -amount,
        description: `Transfer to seller: ${seller.subs_credentials.user_name}${description ? ' - ' + description : ''}`,
        createdAt: new Date()
      });

      // Save subadmin changes
      await subadmin.save();
    }

    // Add transaction to seller's wallet
    seller.wallet.transactions.push({
      amount,
      description: description || (amount >= 0 ? 'Deposit from subadmin' : 'Withdrawal'),
      createdAt: new Date()
    });

    // Update seller's balance
    seller.wallet.balance = (seller.wallet.balance || 0) + amount;

    await seller.save();

    return NextResponse.json({
      _id: seller._id,
      username: seller.subs_credentials.user_name,
      wallet: seller.wallet,
      subadminWalletBalance: subadmin.wallet.balance // Return updated subadmin balance
    });

  } catch (error) {
    console.error('Wallet update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
