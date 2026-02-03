'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useProfile, useUpdateProfile, useUploadAvatar, useSignOut } from '@quillty/api';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const signOut = useSignOut();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateProfile.mutateAsync({
        display_name: displayName || null,
        bio: bio || null,
      });
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    try {
      setError('');
      await uploadAvatar.mutateAsync(file);
      setSuccess('Avatar updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="flex h-16 items-center px-4 lg:px-6">
          <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl p-4 lg:p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-600">
            {success}
          </div>
        )}

        {/* Avatar section */}
        <div className="mb-8 flex items-center gap-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-200 transition hover:opacity-80"
            disabled={uploadAvatar.isPending}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-gray-600">
                {profile?.display_name?.[0] || profile?.username?.[0] || '?'}
              </div>
            )}
            {uploadAvatar.isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </button>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="font-medium text-brand hover:text-brand-dark"
            >
              Change photo
            </button>
            <p className="mt-1 text-sm text-gray-500">JPG, PNG. Max 2MB.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <div className="flex items-center">
              <span className="text-gray-400">@</span>
              <input
                type="text"
                id="username"
                value={profile?.username || ''}
                disabled
                className="min-h-[44px] flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Username cannot be changed
            </p>
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Display name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              placeholder="Your name"
            />
          </div>

          <div>
            <label
              htmlFor="bio"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={300}
              className="min-h-[100px] w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              placeholder="Tell us about yourself and your quilting journey..."
            />
            <p className="mt-1 text-xs text-gray-500">{bio.length}/300</p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="min-h-[44px] flex-1 rounded-lg bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
            >
              {updateProfile.isPending ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>

        {/* Sign out */}
        <div className="mt-12 border-t border-gray-100 pt-6">
          <button
            onClick={handleSignOut}
            disabled={signOut.isPending}
            className="min-h-[44px] w-full rounded-lg border border-red-200 px-4 py-3 font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {signOut.isPending ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  );
}
