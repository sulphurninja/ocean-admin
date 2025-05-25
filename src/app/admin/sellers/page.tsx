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
  UserPlus,
  Plus,
  RefreshCw,
  User as UserIcon,
  AlertCircle,
  CreditCard,
  Calendar,
  History,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export default function AdminSellersPage() {
  const router = useRouter();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSellers: 0,
    totalUsers: 0,
    totalWalletBalance: 0,
    averageUserCharge: 0
  });
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

  useEffect(() => {
    // Check if user is logged in and is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('authToken');

    if (!token || (!user.isAdmin && user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    fetchSellers();
  }, [router]);

  useEffect(() => {
    // Calculate stats whenever sellers data changes
    if (sellers.length > 0) {
      const totalSellers = sellers.length;
      const totalUsers = sellers.reduce((acc, seller) => acc + seller.createdUsers, 0);
      const totalWalletBalance = sellers.reduce((acc, seller) => acc + seller.wallet.balance, 0);
      const avgCharge = sellers.reduce((acc, seller) => acc + seller.userCreationCharge, 0) / totalSellers;

      setStats({
        totalSellers,
        totalUsers,
        totalWalletBalance,
        averageUserCharge: avgCharge
      });
    }
  }, [sellers]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const res = await fetch('/api/admin/sellers', {
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
      const res = await fetch('/api/admin/sellers', {
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

  const addWalletTransaction = async (e) => {
    e.preventDefault();
    if (!selectedSeller || walletTransaction.amount === 0) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/admin/sellers/${selectedSeller._id}/wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(walletTransaction)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update wallet');
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
              <p className="text-xs text-gray-500">Seller Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600"
              onClick={() => router.push('/admin/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Seller Management</h1>
            <p className="text-gray-500">Create and manage sellers and their wallets</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSellers}
            className="self-start"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500 to-indigo-600">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Users className="h-5 w-5" /> Total Sellers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalSellers}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Active seller accounts
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-purple-500 to-purple-600">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <UserPlus className="h-5 w-5" /> Total Users Created
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalUsers}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Users created by all sellers
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-500 to-blue-600">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Wallet className="h-5 w-5" /> Total Wallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900">
                ₹{stats.totalWalletBalance.toLocaleString('en-IN')}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Combined balance of all sellers
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-cyan-500 to-cyan-600">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5" /> Avg. User Charge
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900">
                ₹{stats.averageUserCharge.toFixed(0)}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Average charge per user creation
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
              className="flex-1 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-base py-3"
            >
              <Users className="h-5 w-5 mr-2" /> Sellers
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="flex-1 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-base py-3"
            >
              <UserPlus className="h-5 w-5 mr-2" /> Create Seller
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sellers">
            <Card className="border shadow-md">
              {sellers.length === 0 && !loading ? (
                <CardContent className="py-16">
                  <div className="text-center space-y-4">
                    <Users className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="text-gray-500 text-lg">No sellers found</p>
                    <Button
                      onClick={() => document.querySelector('[data-value="create"]')?.click()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
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
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : sellers.map(seller => (
                        <TableRow key={seller._id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">{seller.username}</TableCell>
                          <TableCell>
                            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
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
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
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
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Create New Seller</CardTitle>
                <CardDescription className="text-gray-600">
                  Add a new seller to your platform. They will be able to create and manage users.
                </CardDescription>
              </CardHeader>

              <CardContent>
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
                        className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                        className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                        className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        min="0"
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
                        className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        min="0"
                      />
                      <p className="text-xs text-gray-500">Initial wallet balance for the seller</p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Create Seller
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Wallet Management Modal */}
      {selectedSeller && (
        <Dialog open={!!selectedSeller} onOpenChange={(open) => !open && setSelectedSeller(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Wallet className="h-5 w-5 text-indigo-600" />
                Manage Wallet: <span className="font-semibold text-indigo-700">{selectedSeller.username}</span>
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Manage wallet balance and view transaction history
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500 to-indigo-600">
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
                  <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500 to-indigo-600">
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
                          className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                          className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="Optional description"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
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
                    <History className="h-5 w-5 text-indigo-600" /> Transaction History
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
