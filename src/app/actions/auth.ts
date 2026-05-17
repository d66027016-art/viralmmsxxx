"use server";

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-hotweb-hd-token-key-2026';

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  subscription: string;
}

// Get the current logged in user from cookie session
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
    return decoded;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

// Log in an existing user
export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // Generate JWT token
    const tokenPayload: UserSession = {
      userId: user.id,
      name: user.name,
      email: user.email,
      subscription: user.subscription,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return { success: true, user: tokenPayload };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: 'Internal server error. Please try again.' };
  }
}

// Register a new user
export async function registerUser(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { success: false, error: 'All fields are required.' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return { success: false, error: 'Email is already registered.' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user with default 'free' plan
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        subscription: 'free',
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`, // default avatar
      },
    });

    const tokenPayload: UserSession = {
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      subscription: newUser.subscription,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return { success: true, user: tokenPayload };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Failed to register. Please try again.' };
  }
}

// Log out user by clearing the session token cookie
export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  return { success: true };
}

// Upgrade user to premium subscription or revert to free
export async function toggleSubscription() {
  const session = await getCurrentUser();
  if (!session) return { success: false, error: 'Not authenticated' };

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) return { success: false, error: 'User not found' };

    const newPlan = user.subscription === 'premium' ? 'free' : 'premium';

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: { subscription: newPlan },
    });

    // Sign new token with updated subscription status
    const tokenPayload: UserSession = {
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      subscription: updatedUser.subscription,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return { success: true, subscription: newPlan };
  } catch (error) {
    console.error('Toggle subscription error:', error);
    return { success: false, error: 'Failed to update subscription' };
  }
}
