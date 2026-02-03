import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useSignIn, useSignInWithGoogle, useSignInWithApple } from '@quillty/api';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const signIn = useSignIn();
  const signInWithGoogle = useSignInWithGoogle();
  const signInWithApple = useSignInWithApple();

  const handleSubmit = async () => {
    setError('');

    try {
      await signIn.mutateAsync({ email, password });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle.mutateAsync('quillty://');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple.mutateAsync('quillty://');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Apple');
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
            {/* Logo */}
            <View className="mb-8 items-center">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand">
                <Ionicons name="grid" size={32} color="white" />
              </View>
            </View>

            <Text className="mb-2 text-center text-2xl font-bold text-gray-900">
              Welcome back
            </Text>
            <Text className="mb-8 text-center text-gray-600">
              Sign in to your account to continue
            </Text>

            {error ? (
              <View className="mb-4 rounded-lg bg-red-50 p-4">
                <Text className="text-sm text-red-600">{error}</Text>
              </View>
            ) : null}

            {/* Social login buttons */}
            <View className="mb-6 gap-3">
              <Pressable
                onPress={handleGoogleSignIn}
                disabled={signInWithGoogle.isPending}
                className="min-h-[48px] flex-row items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 active:bg-gray-50"
              >
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text className="font-medium text-gray-700">
                  Continue with Google
                </Text>
              </Pressable>

              <Pressable
                onPress={handleAppleSignIn}
                disabled={signInWithApple.isPending}
                className="min-h-[48px] flex-row items-center justify-center gap-3 rounded-lg bg-black px-4 py-3 active:bg-gray-800"
              >
                <Ionicons name="logo-apple" size={20} color="white" />
                <Text className="font-medium text-white">
                  Continue with Apple
                </Text>
              </Pressable>
            </View>

            <View className="mb-6 flex-row items-center">
              <View className="h-px flex-1 bg-gray-200" />
              <Text className="px-4 text-sm text-gray-500">or continue with email</Text>
              <View className="h-px flex-1 bg-gray-200" />
            </View>

            {/* Form */}
            <View className="gap-4">
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
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-gray-700">Password</Text>
                  <Link href="/(auth)/forgot-password" asChild>
                    <Pressable>
                      <Text className="text-sm font-medium text-brand">
                        Forgot password?
                      </Text>
                    </Pressable>
                  </Link>
                </View>
                <View className="relative">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
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
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={signIn.isPending}
                className="min-h-[48px] items-center justify-center rounded-lg bg-brand px-4 py-3 active:bg-brand/90"
              >
                <Text className="font-semibold text-white">
                  {signIn.isPending ? 'Signing in...' : 'Sign in'}
                </Text>
              </Pressable>
            </View>

            <View className="mt-6 flex-row items-center justify-center">
              <Text className="text-sm text-gray-600">Don&apos;t have an account? </Text>
              <Link href="/(auth)/signup" asChild>
                <Pressable>
                  <Text className="text-sm font-semibold text-brand">Sign up</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
