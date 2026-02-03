import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useResetPassword } from '@quillty/api';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const resetPassword = useResetPassword();

  const handleSubmit = async () => {
    setError('');

    try {
      await resetPassword.mutateAsync({ email });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    }
  };

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Ionicons name="mail" size={40} color="#16a34a" />
          </View>
          <Text className="mb-2 text-center text-2xl font-bold text-gray-900">
            Check your email
          </Text>
          <Text className="mb-8 text-center text-gray-600">
            We&apos;ve sent a password reset link to{'\n'}
            <Text className="font-medium">{email}</Text>
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text className="font-semibold text-brand">Back to sign in</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
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
            Forgot password?
          </Text>
          <Text className="mb-8 text-gray-600">
            Enter your email and we&apos;ll send you a reset link
          </Text>

          {error ? (
            <View className="mb-4 rounded-lg bg-red-50 p-4">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

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

            <Pressable
              onPress={handleSubmit}
              disabled={resetPassword.isPending}
              className="min-h-[48px] items-center justify-center rounded-lg bg-brand px-4 py-3 active:bg-brand/90"
            >
              <Text className="font-semibold text-white">
                {resetPassword.isPending ? 'Sending...' : 'Send reset link'}
              </Text>
            </Pressable>
          </View>

          <View className="mt-6 flex-row items-center justify-center">
            <Text className="text-sm text-gray-600">Remember your password? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-brand">Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
