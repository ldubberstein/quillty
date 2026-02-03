import { vi } from 'vitest';

// Mock React Native
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: vi.fn((obj) => obj.ios || obj.default),
  },
  StyleSheet: {
    create: vi.fn((styles) => styles),
    flatten: vi.fn((styles) => styles),
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  Pressable: 'Pressable',
  Image: 'Image',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  ActivityIndicator: 'ActivityIndicator',
  Dimensions: {
    get: vi.fn(() => ({ width: 375, height: 812 })),
    addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  },
}));

// Mock nativewind/clsx for className handling
vi.mock('nativewind', () => ({
  styled: vi.fn((component) => component),
}));

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
