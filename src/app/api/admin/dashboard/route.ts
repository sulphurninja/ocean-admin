import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/mongoose';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  await connectDB();

  try {
    // Count total users (excluding admins and sellers)
    const totalUsers = await User.countDocuments({
      role: { $nin: ['admin', 'seller'] },
      isAdmin: { $ne: true }
    });

    // Count total sellers
    const totalSellers = await User.countDocuments({ role: 'seller' });

    return NextResponse.json({
      totalUsers,
      totalSellers
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
