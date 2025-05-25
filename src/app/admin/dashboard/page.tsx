'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCog,
  LogOut,
  BarChart3,
  ShoppingBag,
  DollarSign,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and is admin
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('authToken');

    if (!token || (!userData.isAdmin && userData.role !== 'admin')) {
      router.push('/login');
      return;
    }

    setUser(userData);
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // This would be a new API endpoint to get dashboard stats
      const res = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set some default values if API fails
      setStats({
        totalUsers: 0,
        totalSellers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 rounded-lg bg-white shadow-lg">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-40 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-60 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <header className="bg-white border-b border-gray-200 shadow-sm p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <div className="absolute inset-0.5 rounded-full bg-white flex items-center justify-center">
               <img src='/logo.png'/>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ocean Admin</h1>
              <p className="text-xs text-gray-500">Management Console</p>
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <Badge className="px-3 py-1 bg-indigo-50 text-indigo-700 border-indigo-200">
                <UserIcon className="h-3 w-3 mr-1" /> {user.username}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Welcome Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">Welcome, {user?.username || 'Admin'}</h2>
                <p className="text-indigo-100 mt-1">Here's what's happening with your platform today.</p>
              </div>
              <Button
                onClick={() => fetchStats()}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <BarChart3 className="h-4 w-4 mr-2" /> Refresh Stats
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-500 to-blue-600">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" /> Total Users
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalUsers}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Regular users with active or expired subscriptions
              </p>
              <div className="mt-4">
                <Link href="/admin/users" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                  Manage Users <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-purple-500 to-purple-600">
              <CardTitle className="text-white flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" /> Total Sellers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalSellers}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Resellers with ability to create and manage users
              </p>
              <div className="mt-4">
                <Link href="/admin/sellers" className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium">
                  Manage Sellers <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <h2 className="text-xl font-bold text-gray-800 pt-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/users" className="block group">
            <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 group-hover:text-blue-700 transition-colors">
                  <UserCog className="h-6 w-6 text-blue-600" /> Manage Users
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Comprehensive user management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                    </div>
                    Create new user accounts
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                    </div>
                    Update subscription expiry dates
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                    </div>
                    Manage user devices and access
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="inline-flex items-center text-blue-600 font-medium group-hover:text-blue-800">
                  Go to User Management <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </CardFooter>
            </Card>
          </Link>

          <Link href="/admin/sellers" className="block group">
            <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 group-hover:text-purple-700 transition-colors">
                  <DollarSign className="h-6 w-6 text-purple-600" /> Manage Sellers
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Seller accounts and finances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-purple-100 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-600"></div>
                    </div>
                    Create and manage seller accounts
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-purple-100 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-600"></div>
                    </div>
                    Set pricing and user creation charges
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-purple-100 p-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-600"></div>
                    </div>
                    Manage wallet balances and transactions
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="inline-flex items-center text-purple-600 font-medium group-hover:text-purple-800">
                  Go to Seller Management <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </CardFooter>
            </Card>
          </Link>
        </div>
      </main>

      <footer className="mt-8 border-t border-gray-200 bg-white">
        <div className="container mx-auto p-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Ocean Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
