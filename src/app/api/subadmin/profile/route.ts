import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/mongoose';
import { requireSubadmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const subadmin = await requireSubadmin(req);
  if (subadmin instanceof NextResponse) return subadmin;

  await connectDB();

  try {
    // Use findById to get the most up-to-date document
    const currentUser = await User.findById(subadmin._id).lean();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return the current subadmin's profile data
    return NextResponse.json({
      _id: currentUser._id,
      username: currentUser.subs_credentials.user_name,
      role: currentUser.role,
      wallet: currentUser.wallet,
      createdSellers: currentUser.createdSellers?.length || 0
    });

  } catch (error) {
    console.error('Subadmin profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
