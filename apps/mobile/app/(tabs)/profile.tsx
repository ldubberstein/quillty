import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, useProfile, useUpdateProfile, useUploadAvatar, useSignOut } from '@quillty/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const signOut = useSignOut();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        await uploadAvatar.mutateAsync(blob);
      } catch {
        Alert.alert('Error', 'Failed to upload avatar');
      }
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName || null,
        bio: bio || null,
      });
      setIsEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut.mutateAsync();
          router.replace('/');
        },
      },
    ]);
  };

  if (authLoading || profileLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <View className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="person" size={40} color="#9ca3af" />
          </View>
          <Text className="mb-2 text-xl font-bold text-gray-900">
            Sign in to see your profile
          </Text>
          <Text className="mb-8 text-center text-gray-600">
            Create an account or sign in to save patterns, follow creators, and more.
          </Text>
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            className="min-h-[48px] w-full items-center justify-center rounded-lg bg-brand px-6 py-3"
          >
            <Text className="font-semibold text-white">Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
          <Text className="text-xl font-bold text-gray-900">Profile</Text>
          {isEditing ? (
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setIsEditing(false)}
                className="rounded-lg px-4 py-2"
              >
                <Text className="font-medium text-gray-600">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={updateProfile.isPending}
                className="rounded-lg bg-brand px-4 py-2"
              >
                <Text className="font-semibold text-white">
                  {updateProfile.isPending ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setIsEditing(true)}
              className="rounded-lg bg-gray-100 px-4 py-2"
            >
              <Text className="font-medium text-gray-900">Edit</Text>
            </Pressable>
          )}
        </View>

        {/* Avatar */}
        <View className="items-center py-6">
          <Pressable
            onPress={handlePickImage}
            disabled={uploadAvatar.isPending}
            className="relative"
          >
            <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-200">
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-3xl font-medium text-gray-600">
                  {profile?.display_name?.[0] || profile?.username?.[0] || '?'}
                </Text>
              )}
            </View>
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-brand">
              <Ionicons name="camera" size={16} color="white" />
            </View>
            {uploadAvatar.isPending && (
              <View className="absolute inset-0 items-center justify-center rounded-full bg-black/50">
                <View className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </View>
            )}
          </Pressable>
        </View>

        {/* Profile info */}
        <View className="px-4">
          {isEditing ? (
            <View className="gap-4">
              <View>
                <Text className="mb-1 text-sm font-medium text-gray-700">
                  Display name
                </Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor="#9ca3af"
                  className="min-h-[48px] rounded-lg border border-gray-200 px-4 py-3 text-gray-900"
                />
              </View>

              <View>
                <Text className="mb-1 text-sm font-medium text-gray-700">Bio</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  maxLength={300}
                  className="min-h-[100px] rounded-lg border border-gray-200 px-4 py-3 text-gray-900"
                  textAlignVertical="top"
                />
                <Text className="mt-1 text-xs text-gray-500">{bio.length}/300</Text>
              </View>
            </View>
          ) : (
            <View className="items-center">
              <Text className="text-xl font-bold text-gray-900">
                {profile?.display_name || profile?.username}
              </Text>
              <Text className="text-gray-500">@{profile?.username}</Text>
              {profile?.bio && (
                <Text className="mt-4 text-center text-gray-600">{profile.bio}</Text>
              )}
              <View className="mt-6 flex-row gap-8">
                <View className="items-center">
                  <Text className="text-xl font-bold text-gray-900">
                    {profile?.follower_count || 0}
                  </Text>
                  <Text className="text-sm text-gray-500">Followers</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xl font-bold text-gray-900">
                    {profile?.following_count || 0}
                  </Text>
                  <Text className="text-sm text-gray-500">Following</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Sign out */}
        <View className="mt-12 px-4">
          <Pressable
            onPress={handleSignOut}
            className="min-h-[48px] items-center justify-center rounded-lg border border-red-200 py-3"
          >
            <Text className="font-medium text-red-600">Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
