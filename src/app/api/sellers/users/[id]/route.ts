import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/mongoose';
import { requireSeller } from '@/lib/auth';
import mongoose from 'mongoose';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const seller = await requireSeller(req);
  if (seller instanceof NextResponse) return seller;

  await connectDB();

  try {
    const { id } = params;

    // Find the user
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify that this user was created by the seller
    if (!user.createdBy || user.createdBy.toString() !== seller._id.toString()) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this user' },
        { status: 403 }
      );
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    // Update the seller's createdUsers array
    if (seller.createdUsers) {
      const index = seller.createdUsers.findIndex(
        (userId) => userId.toString() === id
      );

      if (index !== -1) {
        seller.createdUsers.splice(index, 1);
        await seller.save();
      }
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
