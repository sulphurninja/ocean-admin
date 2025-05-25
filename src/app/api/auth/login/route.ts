import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(req: Request) {
  await connectDB();

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = await User.findOne({ 'subs_credentials.user_name': username });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.subs_credentials.password);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = generateToken(user);

    // Build response data based on user role
    let userData = {
      id: user._id,
      username: user.subs_credentials.user_name,
      role: user.role || (user.isAdmin ? 'admin' : 'user'),
      isAdmin: user.isAdmin
    };

    // Add role-specific data
    if (user.role === 'admin' || user.isAdmin) {
      // No additional data needed for admin
    } else if (user.role === 'subadmin') {
      // Add wallet for subadmins
      userData = {
        ...userData,
        wallet: user.wallet
      };
    } else if (user.role === 'seller') {
      // Add wallet and user creation charge for sellers
      userData = {
        ...userData,
        wallet: user.wallet,
        userCreationCharge: user.userCreationCharge
      };
    } else {
      // For regular users, add subscription info
      userData = {
        ...userData,
        plan_expiry: user.plan_expiry,
        devices: user.devices
      };
    }

    return NextResponse.json({
      user: userData,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
