import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/mongoose';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string, deviceId: string } }
) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  await connectDB();

  try {
    const { id, deviceId } = params;

    // Use findOneAndUpdate to atomically update the document
    const result = await User.findByIdAndUpdate(
      id,
      { $pull: { devices: { id: deviceId } } },
      { new: true } // Return the updated document
    );

    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Device removed successfully',
      updatedDevices: result.devices
    });

  } catch (error) {
    console.error('Device deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
