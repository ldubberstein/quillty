import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useSignUp, useCheckUsername } from '@quillty/api';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');

  const signUp = useSignUp();
  const checkUsername = useCheckUsername();

  const validateUsername = useCallback(
    async (value: string) => {
      if (value.length < 3) {
        setUsernameStatus('idle');
        return;
      }

      if (!/^[a-z0-9_]+$/.test(value.toLowerCase())) {
        setUsernameStatus('idle');
        return;
      }

      setUsernameStatus('checking');
      const isAvailable = await checkUsername(value);
      setUsernameStatus(isAvailable ? 'available' : 'taken');
    },
    [checkUsername]
  );

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleaned);
    validateUsername(cleaned);
  };

  const handleSubmit = async () => {
    setError('');

    if (usernameStatus !== 'available') {
      setError('Please choose an available username');
      return;
    }

    try {
      await signUp.mutateAsync({ email, password, username, displayName });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-8">
            {/* Back button */}
            <Pressable
              onPress={() => router.back()}
              className="mb-4 h-11 w-11 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="arrow-back" size={20} color="#111" />
            </Pressable>

            <Text className="mb-2 text-2xl font-bold text-gray-900">
              Create your account
            </Text>
            <Text className="mb-8 text-gray-600">
              Join the quilting community today
            </Text>

            {error ? (
              <View className="mb-4 rounded-lg bg-red-50 p-4">
                <Text className="text-sm text-red-600">{error}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View className="gap-4">
              <View>
                <Text className="mb-1 text-sm font-medium text-gray-700">
                  Display name
                </Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Jane Doe"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  className="min-h-[48px] rounded-lg border border-gray-200 px-4 py-3 text-gray-900"
                />
              </View>

              <View>
                <Text className="mb-1 text-sm font-medium text-gray-700">Username</Text>
                <View className="relative">
                  <Text className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-400">
                    @
                  </Text>
                  <TextInput
                    value={username}
                    onChangeText={handleUsernameChange}
                    placeholder="username"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={30}
                    className="min-h-[48px] rounded-lg border border-gray-200 py-3 pl-8 pr-12 text-gray-900"
                  />
                  <View className="absolute right-4 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <ActivityIndicator size="small" color="#e85d04" />
                    )}
                    {usernameStatus === 'available' && (
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    )}
                    {usernameStatus === 'taken' && (
                      <Ionicons name="close-circle" size={20} color="#dc2626" />
                    )}
                  </View>
                </View>
                <Text className="mt-1 text-xs text-gray-500">
                  Letters, numbers, and underscores only
                </Text>
              </View>

              <View>
                <Text className="mb-1 text-sm font-medium text-gray-700">Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="min-h-[48px] rounded-lg border border-gray-200 px-4 py-3 text-gray-900"
                />
              </View>

              <View>
                <Text className="mb-1 text-sm font-medium text-gray-700">Password</Text>
                <View className="relative">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    className="min-h-[48px] rounded-lg border border-gray-200 px-4 py-3 pr-12 text-gray-900"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#9ca3af"
                    />
                  </Pressable>
                </View>
                <Text className="mt-1 text-xs text-gray-500">At least 8 characters</Text>
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={signUp.isPending || usernameStatus !== 'available'}
                className="min-h-[48px] items-center justify-center rounded-lg bg-brand px-4 py-3 active:bg-brand/90 disabled:opacity-50"
              >
                <Text className="font-semibold text-white">
                  {signUp.isPending ? 'Creating account...' : 'Create account'}
                </Text>
              </Pressable>
            </View>

            <View className="mt-6 flex-row items-center justify-center">
              <Text className="text-sm text-gray-600">Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text className="text-sm font-semibold text-brand">Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
