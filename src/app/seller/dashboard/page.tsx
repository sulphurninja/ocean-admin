'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert";
import {
  Activity,
  AlertCircle,
  Users,
  Wallet,
  Plus,
  RefreshCw,
  User as UserIcon,
  Calendar,
  Trash2,
  AlertTriangleIcon
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function SellerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [userCharge, setUserCharge] = useState(0); // Add a state for user creation charge
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    planDays: 30
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for delete user functionality
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);


  useEffect(() => {
    // Check if user is logged in and is a seller
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('authToken');

    if (!token || (userData.role !== 'seller' && userData.role !== 'admin')) {
      router.push('/login');
      return;
    }

    setUser(userData);

    // If userCreationCharge is available in local storage, set it immediately
    if (userData.userCreationCharge !== undefined) {
      console.log("Setting initial user charge from localStorage:", userData.userCreationCharge);
      setUserCharge(userData.userCreationCharge);
    }

    // If wallet data is available in localStorage, use it immediately
    if (userData.wallet && userData.wallet.balance !== undefined) {
      console.log("Setting initial wallet balance from localStorage:", userData.wallet.balance);
      setWalletBalance(userData.wallet.balance);
    }

    // Fetch current profile data from API
    fetchCurrentUserData(token);
    fetchUsers();

  }, [router]);

  // Fetch fresh user data including wallet balance
  const fetchCurrentUserData = async (token) => {
    try {
      const res = await fetch('/api/sellers/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const userData = await res.json();
        console.log("Fetched user profile:", userData);

        // Update the wallet balance with fresh data
        if (userData.wallet && userData.wallet.balance !== undefined) {
          console.log("Setting wallet balance from API:", userData.wallet.balance);
          setWalletBalance(userData.wallet.balance);
        }

        // Update user creation charge
        if (userData.userCreationCharge !== undefined) {
          console.log("Setting user charge from API:", userData.userCreationCharge);
          setUserCharge(userData.userCreationCharge);

          // Update the local storage with the latest data
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          currentUser.userCreationCharge = userData.userCreationCharge;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      } else {
        console.error("Failed to fetch profile, status:", res.status);
      }
    } catch (error) {
      console.error('Failed to fetch current user data:', error);
    }
  };

  // Add a function to delete a user
  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/sellers/users/${userToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      // Remove the user from the state
      setUsers(users.filter(u => u._id !== userToDelete._id));
      setSuccess(`User "${userToDelete.username}" deleted successfully`);

      // Close the dialog
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      setError(error.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsRefreshing(true);
      const token = localStorage.getItem('authToken');

      const res = await fetch('/api/sellers/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newUser.username || !newUser.password) {
      setError('Username and password are required');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/sellers/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      // If the API returns the updated wallet balance, use it
      if (data.walletBalanceAfter !== undefined) {
        console.log("Setting wallet balance after user creation:", data.walletBalanceAfter);
        setWalletBalance(data.walletBalanceAfter);

        // Update localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.wallet) {
          userData.wallet.balance = data.walletBalanceAfter;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }

      await fetchUsers();
      setNewUser({
        username: '',
        password: '',
        planDays: 30
      });
      setSuccess('User created successfully');
    } catch (error) {
      setError(error.message || 'Failed to create user');
    }
  };

  // Format date to a user-friendly format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Check if plan is expired
  const isPlanExpired = (dateString) => {
    return new Date(dateString) < new Date();
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


  const openResetDialog = (user) => {
    setUserToReset(user);
    setResetDialogOpen(true);
  };

  const resetUserDevices = async () => {
    if (!userToReset) return;

    setResetLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/sellers/users/${userToReset._id}/reset-devices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reset user devices');
      }

      // Update the user in the state
      setUsers(users.map(u => {
        if (u._id === userToReset._id) {
          return { ...u, devices: [] };
        }
        return u;
      }));

      setSuccess(`Devices for user "${userToReset.username}" reset successfully`);

      // Close the dialog
      setResetDialogOpen(false);
      setUserToReset(null);
    } catch (error) {
      setError(error.message || 'Failed to reset user devices');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <header className="bg-white border-b border-gray-200 shadow-sm p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"></div>
              <div className="absolute inset-0.5 rounded-full bg-white flex items-center justify-center">
                <img src='/logo.png' />
              </div>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Ocean Seller Hub</h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <Badge className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                <UserIcon className="h-3 w-3 mr-1" /> {user.username}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-500 to-blue-600">
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5" /> Wallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className={`text-3xl font-bold ${Number(walletBalance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{walletBalance}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {Number(walletBalance) >= 0
                  ? 'Available for new user creation'
                  : 'Balance is negative - contact admin to recharge'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500 to-indigo-600">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" /> Total Users
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900">
                {users.length}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Active and expired accounts
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-cyan-500 to-cyan-600">
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5" /> User Creation Cost
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900">
                ₹{userCharge}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Charged per new user
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white p-1 shadow-md rounded-lg border w-full flex justify-start h-14">
            <TabsTrigger
              value="users"
              className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-base py-3"
            >
              <Users className="h-5 w-5 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-base py-3"
            >
              <Plus className="h-5 w-5 mr-2" /> Create User
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Your Users</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                disabled={isRefreshing}
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <Card className="border shadow-md">
              {users.length === 0 && !loading ? (
                <CardContent className="py-16">
                  <div className="text-center space-y-4">
                    <Users className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="text-gray-500 text-lg">You haven't created any users yet.</p>
                    <Button
                      onClick={() => document.querySelector('[data-value="create"]')?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Create Your First User
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-gray-700 font-semibold">Username</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Plan Expiry</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Devices</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Created At</TableHead>
                        <TableHead className="text-gray-700 font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : users.map(user => (
                        <TableRow key={user._id}>
                          <TableCell className="font-medium text-gray-900">{user.username}</TableCell>
                          <TableCell>
                            {user.plan_expiry ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className={isPlanExpired(user.plan_expiry) ?
                                  'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                                  {formatDate(user.plan_expiry)}
                                </span>
                                {isPlanExpired(user.plan_expiry) && (
                                  <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                                    EXPIRED
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">No subscription</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {user.devices?.length || 0} devices
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openResetDialog(user)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card className="border shadow-md">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="text-gray-800 text-xl">Create New User</CardTitle>
                <CardDescription className="text-gray-600">
                  Add a new user to your network. This will deduct ₹{userCharge} from your wallet.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                {error && (
                  <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-800">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <AlertTitle className="text-red-800 font-semibold">Error</AlertTitle>
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
                    <AlertCircle className="h-5 w-5 text-green-600" />
                    <AlertTitle className="text-green-800 font-semibold">Success</AlertTitle>
                    <AlertDescription className="text-green-700">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={createUser} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-gray-700 font-medium">
                        Username *
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-medium">
                        Password *
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="planDays" className="text-gray-700 font-medium">
                        Plan Duration (days)
                      </Label>
                      <Input
                        id="planDays"
                        type="number"
                        value={newUser.planDays}
                        onChange={(e) => setNewUser({ ...newUser, planDays: parseInt(e.target.value) })}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6 shadow-md"
                  >
                    <Plus className="h-5 w-5 mr-2" /> Create User
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col items-start border-t pt-4 bg-gray-50">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> Creating a user will deduct ₹{userCharge} from your wallet balance.
                  Your current balance is <span className={Number(walletBalance) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    ₹{walletBalance}
                  </span>.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>


      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <RefreshCw className="h-5 w-5" /> Reset User Devices
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all devices for user "{userToReset?.username}"?
              This will log them out from all devices and they will need to log in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
              disabled={resetLoading}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={resetUserDevices}
              disabled={resetLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {resetLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" /> Reset Devices
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="mt-8 border-t border-gray-200 bg-white">
        <div className="container mx-auto p-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Ocean Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
