import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();

  try {
    const { id } = params;

    // Find the user
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Reset devices array to empty
    user.devices = [];
    await user.save();

    return NextResponse.json({
      message: 'All devices reset successfully',
      user: {
        _id: user._id,
        username: user.subs_credentials?.user_name,
        devices: user.devices
      }
    });

  } catch (error) {
    console.error('Device reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
