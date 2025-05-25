import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/mongoose';
import { requireSeller } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const seller = await requireSeller(req);
  if (seller instanceof NextResponse) return seller;

  await connectDB();

  try {
    // Use findById to get the most up-to-date document
    const currentUser = await User.findById(seller._id).lean();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Log what we're returning
    console.log("Profile API returning:", {
      wallet: currentUser.wallet,
      userCreationCharge: currentUser.userCreationCharge
    });

    // Return the current seller's profile data
    return NextResponse.json({
      _id: currentUser._id,
      username: currentUser.subs_credentials.user_name,
      role: currentUser.role,
      userCreationCharge: currentUser.userCreationCharge,
      wallet: currentUser.wallet,
      createdUsers: currentUser.createdUsers?.length || 0
    });

  } catch (error) {
    console.error('Seller profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
