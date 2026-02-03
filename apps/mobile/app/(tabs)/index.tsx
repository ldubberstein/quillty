import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Feed() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
        <Text className="text-2xl font-bold text-gray-900">Quillty</Text>
        <View className="flex-row">
          <Pressable className="rounded-full bg-brand px-4 py-2">
            <Text className="text-sm font-semibold text-white">For You</Text>
          </Pressable>
          <Pressable className="ml-2 rounded-full bg-gray-100 px-4 py-2">
            <Text className="text-sm font-medium text-gray-600">Following</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView className="flex-1 p-4">
        <View className="items-center justify-center py-20">
          <Text className="text-lg text-gray-500">
            Feed coming soon...
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
