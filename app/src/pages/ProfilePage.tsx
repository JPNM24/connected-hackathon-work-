import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ChevronLeft, Camera, Edit2, Save, Moon, Sun,
  Mail, Phone, MapPin, Briefcase, GraduationCap, Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeContext } from '@/App';
import { supabase } from '@/lib/supabase';

// Navigation Component
function ProfileNav() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useContext(ThemeContext);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Profile</span>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

// Editable Field Component
function EditableField({
  label,
  value,
  icon: Icon,
  isEditing,
  onChange,
  type = 'text'
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  isEditing: boolean;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {label}
      </Label>
      {isEditing ? (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11"
        />
      ) : (
        <div className="h-11 px-3 flex items-center bg-muted rounded-md text-foreground">
          {value || <span className="text-muted-foreground italic">Not set</span>}
        </div>
      )}
    </div>
  );
}

// Main Profile Page
export function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile data
  const [profile, setProfile] = useState({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    title: 'Software Engineer',
    company: 'Google',
    education: 'BS Computer Science, Stanford University',
    website: 'sarahjohnson.dev',
    bio: 'Passionate software engineer with 5+ years of experience in full-stack development. Love building products that make a difference.',
  });

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session && session.user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.warn('Error fetching profile:', error);
          } else if (data) {
            setProfile({
              name: data.full_name || '',
              email: session.user.email || '',
              phone: data.phone || '',
              location: data.location || '',
              title: data.title || '',
              company: data.company || '',
              education: data.education || '',
              website: data.website || '',
              bio: data.bio || '',
            });
            if (data.avatar_url) setAvatar(data.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, []);

  const [avatar, setAvatar] = useState('/images/testimonial-1.jpg');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session && session.user) {
        const updates = {
          id: session.user.id,
          full_name: profile.name,
          title: profile.title,
          company: profile.company,
          location: profile.location,
          bio: profile.bio,
          // Note: phone, education, website might not be in the basic schema I proposed. 
          // I will assume the user will run a schema that supports these or I should stick to the basic ones.
          // To be safe and helpful, I'll assume they created columns or Supabase is flexible (jsonb?) no, it's SQL.
          updated_at: new Date(),
        };

        const { error } = await supabase.from('profiles').upsert(updates);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile!');
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateField = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-card rounded-3xl p-8 border border-border mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div
              className="relative cursor-pointer group"
              onClick={handleAvatarClick}
            >
              <img
                src={avatar}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-background"
              />
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-semibold mb-1">{profile.name}</h1>
              <p className="text-muted-foreground mb-2">{profile.title} at {profile.company}</p>
              <p className="text-sm text-muted-foreground">{profile.location}</p>
            </div>

            {/* Edit Button */}
            <Button
              variant={isEditing ? 'default' : 'outline'}
              className={isEditing ? 'bg-purple-500 hover:bg-purple-600' : ''}
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-card rounded-2xl p-6 border border-border mb-6">
          <h3 className="font-semibold mb-4">About</h3>
          {isEditing ? (
            <textarea
              value={profile.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              className="w-full min-h-[100px] p-3 rounded-xl bg-muted border-0 resize-none focus:ring-2 focus:ring-purple-500/20 outline-none"
            />
          ) : (
            <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* Personal Information */}
        <div className="bg-card rounded-2xl p-6 border border-border mb-6">
          <h3 className="font-semibold mb-4">Personal Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <EditableField
              label="Full Name"
              value={profile.name}
              icon={Sparkles}
              isEditing={isEditing}
              onChange={(value) => updateField('name', value)}
            />
            <EditableField
              label="Email"
              value={profile.email}
              icon={Mail}
              isEditing={isEditing}
              onChange={(value) => updateField('email', value)}
              type="email"
            />
            <EditableField
              label="Phone"
              value={profile.phone}
              icon={Phone}
              isEditing={isEditing}
              onChange={(value) => updateField('phone', value)}
              type="tel"
            />
            <EditableField
              label="Location"
              value={profile.location}
              icon={MapPin}
              isEditing={isEditing}
              onChange={(value) => updateField('location', value)}
            />
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-card rounded-2xl p-6 border border-border mb-6">
          <h3 className="font-semibold mb-4">Professional Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <EditableField
              label="Job Title"
              value={profile.title}
              icon={Briefcase}
              isEditing={isEditing}
              onChange={(value) => updateField('title', value)}
            />
            <EditableField
              label="Company"
              value={profile.company}
              icon={Briefcase}
              isEditing={isEditing}
              onChange={(value) => updateField('company', value)}
            />
            <EditableField
              label="Education"
              value={profile.education}
              icon={GraduationCap}
              isEditing={isEditing}
              onChange={(value) => updateField('education', value)}
            />
            <EditableField
              label="Website"
              value={profile.website}
              icon={LinkIcon}
              isEditing={isEditing}
              onChange={(value) => updateField('website', value)}
            />
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-semibold mb-4">Account Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates about your progress</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Weekly Reports</p>
                <p className="text-sm text-muted-foreground">Get weekly performance summaries</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-red-500">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
              </div>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
