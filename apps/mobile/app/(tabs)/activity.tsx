import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Activity() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg text-gray-500">Activity coming soon...</Text>
      </View>
    </SafeAreaView>
  );
}
