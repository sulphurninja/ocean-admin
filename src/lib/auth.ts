import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import connectDB from './mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export function generateToken(user: any) {
  return jwt.sign(
    {
      id: user._id,
      username: user.subs_credentials.user_name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateUser(req: NextRequest) {
  await connectDB();

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await User.findById(decoded.id);

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}



// Check if the user is a subadmin
// Check if the user is a subadmin
export async function requireSubadmin(req: NextRequest) {
  await connectDB();

  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use the same JWT_SECRET as in your generateToken function
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Use 'id' instead of 'userId' to match your token structure
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      console.error(`User not found for ID: ${userId}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is a subadmin
    if (user.role !== 'subadmin') {
      return NextResponse.json(
        { error: 'Forbidden: Subadmin access required' },
        { status: 403 }
      );
    }

    return user;
  } catch (error) {
    console.error('Auth error:', error);

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function requireAuth(req: NextRequest) {
  const user = await authenticateUser(req);

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return user;
}

export async function requireAdmin(req: NextRequest) {
  const user = await authenticateUser(req);

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (user.role !== 'admin' && !user.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return user;
}

export async function requireSeller(req: NextRequest) {
  const user = await authenticateUser(req);

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (user.role !== 'seller' && user.role !== 'admin' && !user.isAdmin) {
    return NextResponse.json(
      { error: 'Seller access required' },
      { status: 403 }
    );
  }

  return user;
}
