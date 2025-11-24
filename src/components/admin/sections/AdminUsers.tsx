import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Users, UserCheck, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface UserProfile {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  exam_date: string;
  created_at: string;
  language_name?: string;
  roles?: string[];
}
interface UserStats {
  total: number;
  thisMonth: number;
  thisWeek: number;
  active: number;
}
export const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
    active: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchUsers();
  }, []);
  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterBy]);
  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      
      // Fetch user profiles with their language info
      const {
        data: profiles,
        error: profileError
      } = await supabase.from('profiles').select(`
          id,
          full_name,
          phone_number,
          exam_date,
          created_at,
          language_id
        `).order('created_at', {
        ascending: false
      });
      
      console.log('Profiles fetched:', profiles);
      
      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      // Fetch all languages once
      const { data: languages } = await supabase.from('languages').select('id, name');
      console.log('Languages fetched:', languages);

      // Fetch roles and email for each user
      const usersWithDetails = await Promise.all((profiles || []).map(async profile => {
        console.log('Processing profile:', profile.id);
        
        const {
          data: roles
        } = await supabase.from('user_roles').select('role').eq('user_id', profile.id);
        
        // Get email using our secure function
        let email = 'N/A';
        try {
          const { data: userEmail } = await supabase.rpc('get_user_email', { user_id: profile.id });
          email = userEmail || 'N/A';
          console.log('Email for', profile.id, ':', email);
        } catch (error) {
          console.log('Could not fetch email for user:', profile.id, error);
        }
        
        // Find language name
        const language = languages?.find(l => l.id === profile.language_id);
        
        return {
          ...profile,
          email: email,
          language_name: language?.name || 'Not selected',
          roles: roles?.map(r => r.role) || []
        };
      }));

      console.log('Users with details:', usersWithDetails);
      setUsers(usersWithDetails);
      calculateStats(usersWithDetails);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const calculateStats = (userData: UserProfile[]) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const stats = {
      total: userData.length,
      thisWeek: userData.filter(user => new Date(user.created_at) >= oneWeekAgo).length,
      thisMonth: userData.filter(user => new Date(user.created_at) >= oneMonthAgo).length,
      active: userData.filter(user => new Date(user.exam_date) >= now).length
    };
    setStats(stats);
  };
  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.phone_number?.includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filterBy !== 'all') {
      const now = new Date();
      switch (filterBy) {
        case 'active':
          filtered = filtered.filter(user => new Date(user.exam_date) >= now);
          break;
        case 'expired':
          filtered = filtered.filter(user => new Date(user.exam_date) < now);
          break;
        case 'admin':
          filtered = filtered.filter(user => user.roles?.includes('admin'));
          break;
        case 'recent':
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(user => new Date(user.created_at) >= oneWeekAgo);
          break;
      }
    }
    setFilteredUsers(filtered);
  };
  const assignAdminRole = async (userId: string) => {
    try {
      const {
        error
      } = await supabase.from('user_roles').insert([{
        user_id: userId,
        role: 'admin'
      }]);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Admin role assigned successfully"
      });
      fetchUsers();
    } catch (error) {
      console.error('Error assigning admin role:', error);
      toast({
        title: "Error",
        description: "Failed to assign admin role",
        variant: "destructive"
      });
    }
  };
  const removeAdminRole = async (userId: string) => {
    try {
      const {
        error
      } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
      if (error) throw error;
      toast({
        title: "Success",
        description: "Admin role removed successfully"
      });
      fetchUsers();
    } catch (error) {
      console.error('Error removing admin role:', error);
      toast({
        title: "Error",
        description: "Failed to remove admin role",
        variant: "destructive"
      });
    }
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold mx-[4px] my-[44px]">User Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, or phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Users</SelectItem>
                <SelectItem value="expired">Expired Users</SelectItem>
                <SelectItem value="admin">Admin Users</SelectItem>
                <SelectItem value="recent">Recent Signups</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8">Loading users...</div> : filteredUsers.length === 0 ? <div className="text-center py-8 text-muted-foreground">No users found</div> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Exam Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => {
              const isActive = new Date(user.exam_date) >= new Date();
              const isAdmin = user.roles?.includes('admin');
              return <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.email}
                      </TableCell>
                      <TableCell>{user.phone_number || 'N/A'}</TableCell>
                      <TableCell className="text-sm">
                        {user.language_name}
                      </TableCell>
                      <TableCell>
                        {user.exam_date ? new Date(user.exam_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? 'default' : 'secondary'}>
                          {isActive ? 'Active' : 'Expired'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isAdmin ? 'destructive' : 'outline'}>
                          {isAdmin ? 'Admin' : 'User'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {isAdmin ? <Button size="sm" variant="outline" onClick={() => removeAdminRole(user.id)}>
                            Remove Admin
                          </Button> : <Button size="sm" variant="outline" onClick={() => assignAdminRole(user.id)}>
                            Make Admin
                          </Button>}
                      </TableCell>
                    </TableRow>;
            })}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>
    </div>;
};