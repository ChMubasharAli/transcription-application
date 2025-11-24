import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, Calendar, Globe, Mail, Edit, Save, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfileData {
  full_name: string | null;
  phone_number: string | null;
  exam_date: string | null;
  language: string | null;
  language_id: string | null;
  email: string | null;
}

interface Language {
  id: string;
  name: string;
  code: string;
}

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<UserProfileData>({
    full_name: null,
    phone_number: null,
    exam_date: null,
    language: null,
    language_id: null,
    email: null
  });
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchLanguages();
    }
  }, [user]);

  const fetchLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('id, name, code')
        .order('name');

      if (error) throw error;
      setAvailableLanguages(data || []);
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          full_name,
          phone_number,
          exam_date,
          language_id,
          languages (name)
        `)
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;

      setProfileData({
        full_name: profile?.full_name || null,
        phone_number: profile?.phone_number || null,
        exam_date: profile?.exam_date || null,
        language: profile?.languages?.name || null,
        language_id: profile?.language_id || null,
        email: user!.email || null
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone_number: profileData.phone_number,
          exam_date: profileData.exam_date,
          language_id: profileData.language_id
        })
        .eq('id', user!.id);

      if (error) throw error;

      // Refetch profile data to update the UI
      await fetchProfileData();

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error", 
        description: "Failed to update profile"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfileData(); // Reset to original data
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <User className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">User Profile</h2>
            <p className="text-muted-foreground">Loading your profile information...</p>
          </div>
        </div>
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <User className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">User Profile</h2>
            <p className="text-muted-foreground">View and manage your account information</p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
            {getInitials(profileData.full_name, profileData.email)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">
              {profileData.full_name || 'User Profile'}
            </h3>
            <p className="text-muted-foreground">NAATI CCL Candidate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name" className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4" />
                <span>Full Name</span>
              </Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={profileData.full_name || ''}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    full_name: e.target.value
                  }))}
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-card-foreground px-3 py-2 bg-muted rounded-md">
                  {profileData.full_name || 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center space-x-2 mb-2">
                <Mail className="h-4 w-4" />
                <span>Email Address</span>
              </Label>
              <p className="text-card-foreground px-3 py-2 bg-muted rounded-md">
                {profileData.email || 'Not available'}
              </p>
            </div>

            <div>
              <Label htmlFor="phone_number" className="flex items-center space-x-2 mb-2">
                <Phone className="h-4 w-4" />
                <span>Phone Number</span>
              </Label>
              {isEditing ? (
                <Input
                  id="phone_number"
                  value={profileData.phone_number || ''}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    phone_number: e.target.value
                  }))}
                  placeholder="Enter your phone number"
                />
              ) : (
                <p className="text-card-foreground px-3 py-2 bg-muted rounded-md">
                  {profileData.phone_number || 'Not provided'}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="exam_date" className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span>NAATI CCL Exam Date</span>
              </Label>
              {isEditing ? (
                <Input
                  id="exam_date"
                  type="date"
                  value={profileData.exam_date || ''}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    exam_date: e.target.value
                  }))}
                />
              ) : (
                <p className="text-card-foreground px-3 py-2 bg-muted rounded-md">
                  {formatDate(profileData.exam_date)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="language" className="flex items-center space-x-2 mb-2">
                <Globe className="h-4 w-4" />
                <span>Practice Language</span>
              </Label>
              {isEditing ? (
                <Select
                  value={profileData.language_id || ''}
                  onValueChange={(value) => setProfileData(prev => ({
                    ...prev,
                    language_id: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-card-foreground px-3 py-2 bg-muted rounded-md">
                  {profileData.language || 'No language selected'}
                </p>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-border">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Status</span>
            <span className="text-card-foreground font-medium">Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member Since</span>
            <span className="text-card-foreground">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-AU', {
                year: 'numeric',
                month: 'long'
              }) : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated</span>
            <span className="text-card-foreground">
              {user?.updated_at ? new Date(user.updated_at).toLocaleDateString('en-AU') : 'Unknown'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}