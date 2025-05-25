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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Wallet,
  Store,
  Plus,
  RefreshCw,
  User as UserIcon,
  AlertCircle,
  CreditCard,
  Calendar,
  History,
  ArrowUp,
  ArrowDown,
  Shield
} from 'lucide-react';

export default function SubadminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSeller, setNewSeller] = useState({
    username: '',
    password: '',
    userCreationCharge: 399,
    initialBalance: 1000
  });
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [walletTransaction, setWalletTransaction] = useState({
    amount: 0,
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalSellers: 0,
    totalUsers: 0,
    totalSellerWalletBalance: 0
  });

  useEffect(() => {
    // Check if user is logged in and is a subadmin
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('authToken');

    if (!token || userData.role !== 'subadmin') {
      router.push('/login');
      return;
    }

    setUser(userData);

    // If wallet data is available in localStorage, use it immediately
    if (userData.wallet && userData.wallet.balance !== undefined) {
      setWalletBalance(userData.wallet.balance);
    }

    // Fetch current profile data from API
    fetchCurrentUserData(token);
    fetchSellers();
  }, [router]);

  // Calculate statistics when sellers data changes
  useEffect(() => {
    if (sellers.length > 0) {
      const totalSellers = sellers.length;
      const totalUsers = sellers.reduce((acc, seller) => acc + seller.createdUsers, 0);
      const totalSellerWalletBalance = sellers.reduce((acc, seller) => acc + seller.wallet.balance, 0);

      setStats({
        totalSellers,
        totalUsers,
        totalSellerWalletBalance
      });
    }
  }, [sellers]);

  // Fetch fresh user data including wallet balance
  const fetchCurrentUserData = async (token) => {
    try {
      const res = await fetch('/api/subadmin/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const userData = await res.json();
        console.log("Fetched subadmin profile:", userData);

        // Update the wallet balance with fresh data
        if (userData.wallet && userData.wallet.balance !== undefined) {
          setWalletBalance(userData.wallet.balance);
        }

        // Update the local storage with the latest data
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUser.wallet = userData.wallet;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error('Failed to fetch current user data:', error);
    }
  };

  const fetchSellers = async () => {
    try {
      setIsRefreshing(true);
      const token = localStorage.getItem('authToken');

      const res = await fetch('/api/subadmin/sellers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch sellers');
      }

      const data = await res.json();
      setSellers(data);
    } catch (error) {
      console.error('Failed to load sellers:', error);
      setError('Failed to load sellers. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const createSeller = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newSeller.username || !newSeller.password) {
      setError('Username and password are required');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/subadmin/sellers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSeller)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create seller');
      }

      // If the API returns the updated wallet balance, use it
      if (data.walletBalanceAfter !== undefined) {
        setWalletBalance(data.walletBalanceAfter);

        // Update localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.wallet) {
          userData.wallet.balance = data.walletBalanceAfter;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }

      await fetchSellers();
      setNewSeller({
        username: '',
        password: '',
        userCreationCharge: 399,
        initialBalance: 1000
      });
      setSuccess('Seller created successfully');
    } catch (error) {
      setError(error.message || 'Failed to create seller');
    }
  };

  // In the addWalletTransaction function, update the error handling:
  const addWalletTransaction = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedSeller || walletTransaction.amount === 0) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/subadmin/sellers/${selectedSeller._id}/wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(walletTransaction)
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle insufficient balance specifically
        if (res.status === 400 && data.error && data.error.includes('Insufficient wallet balance')) {
          throw new Error(
            `Insufficient wallet balance. You need ₹${data.required} but only have ₹${data.current}. Shortage: ₹${data.shortage}.`
          );
        }
        throw new Error(data.error || 'Failed to update wallet');
      }

      // Update the local wallet balance if returned by the API
      if (data.subadminWalletBalance !== undefined) {
        setWalletBalance(data.subadminWalletBalance);

        // Update localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.wallet) {
          userData.wallet.balance = data.subadminWalletBalance;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }

      await fetchSellers();
      setWalletTransaction({ amount: 0, description: '' });
      setSuccess('Wallet updated successfully');
    } catch (error) {
      setError(error.message || 'Failed to update wallet');
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              <div className="absolute inset-0.5 rounded-full bg-white flex items-center justify-center">
               <img src='/logo.png'/>
              </div>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Ocean Sub-Admin Hub</h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <Badge className="px-3 py-1 bg-purple-50 text-purple-700 border-purple-200">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-purple-500 to-purple-600">
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5" /> Your Wallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className={`text-3xl font-bold ${Number(walletBalance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{walletBalance}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Available for seller creation
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500 to-indigo-600">
              <CardTitle className="text-white flex items-center gap-2">
                <Store className="h-5 w-5" /> Total Sellers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalSellers}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Sellers you've created
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-500 to-blue-600">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" /> Total End Users
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalUsers}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Created by your sellers
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-pink-500 to-pink-600">
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5" /> Sellers' Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900">
                ₹{stats.totalSellerWalletBalance}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Total in sellers' wallets
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800 font-semibold">Error</AlertTitle>
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <AlertCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800 font-semibold">Success</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="sellers" className="space-y-6">
          <TabsList className="bg-white p-1 shadow-md rounded-lg border w-full flex justify-start h-14">
            <TabsTrigger
              value="sellers"
              className="flex-1 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm text-base py-3"
            >
              <Store className="h-5 w-5 mr-2" /> Sellers
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="flex-1 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm text-base py-3"
            >
              <Plus className="h-5 w-5 mr-2" /> Create Seller
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sellers">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Your Sellers</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSellers}
                disabled={isRefreshing}
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <Card className="border shadow-md mt-4">
              {sellers.length === 0 && !loading ? (
                <CardContent className="py-16">
                  <div className="text-center space-y-4">
                    <Store className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="text-gray-500 text-lg">You haven't created any sellers yet.</p>
                    <Button
                      onClick={() => document.querySelector('[data-value="create"]')?.click()}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Create Your First Seller
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-gray-700 font-semibold">Username</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Created Users</TableHead>
                        <TableHead className="text-gray-700 font-semibold">User Charge</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Wallet Balance</TableHead>
                        <TableHead className="text-gray-700 font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : sellers.map(seller => (
                        <TableRow key={seller._id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">{seller.username}</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                              {seller.createdUsers} users
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">₹{seller.userCreationCharge}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${seller.wallet.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{seller.wallet.balance}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => setSelectedSeller(seller)}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                              size="sm"
                            >
                              <Wallet className="h-4 w-4 mr-1.5" /> Manage Wallet
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
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50">
                <CardTitle className="text-gray-800 text-xl">Create New Seller</CardTitle>
                <CardDescription className="text-gray-600">
                  Add a new seller to your network. This will deduct ₹{newSeller.initialBalance} from your wallet.
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

                <form onSubmit={createSeller} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-gray-700 font-medium">
                        Username *
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        value={newSeller.username}
                        onChange={(e) => setNewSeller({ ...newSeller, username: e.target.value })}
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                        value={newSeller.password}
                        onChange={(e) => setNewSeller({ ...newSeller, password: e.target.value })}
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="userCreationCharge" className="text-gray-700 font-medium">
                        User Creation Charge (₹)
                      </Label>
                      <Input
                        id="userCreationCharge"
                        type="number"
                        value={newSeller.userCreationCharge}
                        onChange={(e) => setNewSeller({ ...newSeller, userCreationCharge: parseFloat(e.target.value) })}
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        min="0"
                        required
                      />
                      <p className="text-xs text-gray-500">Amount charged to seller for each user creation</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="initialBalance" className="text-gray-700 font-medium">
                        Initial Balance (₹)
                      </Label>
                      <Input
                        id="initialBalance"
                        type="number"
                        value={newSeller.initialBalance}
                        onChange={(e) => setNewSeller({ ...newSeller, initialBalance: parseFloat(e.target.value) })}
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        min="0"
                        required
                      />
                      <p className="text-xs text-gray-500">Initial wallet balance for the seller</p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6 shadow-md"
                  >
                    <Plus className="h-5 w-5 mr-2" /> Create Seller
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col items-start border-t pt-4 bg-gray-50">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> Creating a seller will deduct the initial balance amount from your wallet.
                  Your current balance is <span className={Number(walletBalance) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    ₹{walletBalance}
                  </span>.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Wallet Management Modal */}
      {selectedSeller && (
        <Dialog open={!!selectedSeller} onOpenChange={(open) => !open && setSelectedSeller(null)}>
          <DialogContent className="max-w-3xl m-auto h-fit max-h-screen  overflow-y-scroll">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Wallet className="h-5 w-5 text-purple-600" />
                Manage Wallet: <span className="font-semibold text-purple-700">{selectedSeller.username}</span>
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Manage wallet balance and view transaction history
              </DialogDescription>
            </DialogHeader>
            {/* Show error message at the top of the dialog if it exists */}
            {error && (
              <Alert variant="destructive" className="my-4 bg-red-50 border-red-200 text-red-800">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-800 font-semibold">Error</AlertTitle>
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="my-4 bg-green-50 border-green-200 text-green-800">
                <AlertCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800 font-semibold">Success</AlertTitle>
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 bg-gradient-to-r from-purple-500 to-purple-600">
                    <CardTitle className="text-white text-base">Current Balance</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className={`text-3xl font-bold ${selectedSeller.wallet.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{selectedSeller.wallet.balance}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Last updated: {formatDate(selectedSeller.wallet.transactions?.[0]?.createdAt)}</p>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 bg-gradient-to-r from-purple-500 to-purple-600">
                    <CardTitle className="text-white text-base">Add Transaction</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <form onSubmit={addWalletTransaction} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-gray-700">Amount (₹)</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={walletTransaction.amount}
                          onChange={(e) => setWalletTransaction({
                            ...walletTransaction,
                            amount: parseFloat(e.target.value)
                          })}
                          className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Use positive values for deposits and negative for withdrawals
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-700">Description</Label>
                        <Input
                          id="description"
                          type="text"
                          value={walletTransaction.description}
                          onChange={(e) => setWalletTransaction({
                            ...walletTransaction,
                            description: e.target.value
                          })}
                          className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          placeholder="Optional description"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <CreditCard className="h-4 w-4 mr-2" /> Add Transaction
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction History */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <History className="h-5 w-5 text-purple-600" /> Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {selectedSeller.wallet.transactions?.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-gray-700">Date & Time</TableHead>
                            <TableHead className="text-gray-700">Description</TableHead>
                            <TableHead className="text-gray-700 text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSeller.wallet.transactions.map((tx, idx) => (
                            <TableRow key={idx} className="hover:bg-gray-50">
                              <TableCell className="text-gray-600 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                  {formatDate(tx.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium text-gray-800">
                                {tx.description || 'Transaction'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className={`flex items-center justify-end font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {tx.amount >= 0 ? (
                                    <ArrowUp className="h-3.5 w-3.5 mr-1.5" />
                                  ) : (
                                    <ArrowDown className="h-3.5 w-3.5 mr-1.5" />
                                  )}
                                  ₹{Math.abs(tx.amount)}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      No transaction history available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedSeller(null)}
                className="border-gray-300 text-gray-700"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <footer className="mt-8 border-t border-gray-200 bg-white">
        <div className="container mx-auto p-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Ocean Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
