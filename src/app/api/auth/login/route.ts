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

    return NextResponse.json({
      user: {
        id: user._id,
        username: user.subs_credentials.user_name,
        role: user.role || (user.isAdmin ? 'admin' : 'user'),
        isAdmin: user.isAdmin,
        wallet: user.role === 'seller' ? user.wallet : undefined
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
