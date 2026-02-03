import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-8">
      <View className="mb-6 h-16 w-16 items-center justify-center rounded-xl bg-brand">
        <Text className="text-3xl text-white">Q</Text>
      </View>
      <Text className="mb-2 text-4xl font-bold tracking-tight text-gray-900">
        Quillty
      </Text>
      <Text className="mb-8 text-center text-lg text-gray-600">
        Discover & create quilting patterns
      </Text>
      <View className="flex-row gap-4">
        <Link href="/(tabs)" asChild>
          <Pressable className="min-h-[44px] items-center justify-center rounded-full bg-brand px-6 py-3">
            <Text className="font-semibold text-white">Explore Patterns</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
