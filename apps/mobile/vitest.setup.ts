import { vi } from 'vitest';

// Mock React Native core
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: vi.fn((obj) => obj.ios || obj.default),
    Version: 17,
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
  Alert: {
    alert: vi.fn(),
  },
  Linking: {
    openURL: vi.fn(),
    canOpenURL: vi.fn().mockResolvedValue(true),
  },
}));

// Mock Expo modules
vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    canGoBack: vi.fn(() => true),
  })),
  useLocalSearchParams: vi.fn(() => ({})),
  useSegments: vi.fn(() => []),
  usePathname: vi.fn(() => '/'),
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
}));

vi.mock('expo-image', () => ({
  Image: 'ExpoImage',
}));

vi.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: vi.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://mock-image.jpg', width: 100, height: 100 }],
  }),
  launchCameraAsync: vi.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://mock-camera.jpg', width: 100, height: 100 }],
  }),
  requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  MediaTypeOptions: {
    Images: 'Images',
    Videos: 'Videos',
    All: 'All',
  },
}));

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

vi.mock('expo-linking', () => ({
  createURL: vi.fn((path) => `exp://localhost:19000/${path}`),
  openURL: vi.fn(),
}));

vi.mock('expo-font', () => ({
  useFonts: vi.fn(() => [true, null]),
  loadAsync: vi.fn().mockResolvedValue(undefined),
}));

// Mock react-native-gesture-handler
vi.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: 'GestureHandlerRootView',
  Swipeable: 'Swipeable',
  DrawerLayout: 'DrawerLayout',
  State: {},
  TapGestureHandler: 'TapGestureHandler',
  PanGestureHandler: 'PanGestureHandler',
}));

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    createAnimatedComponent: vi.fn((component) => component),
  },
  useSharedValue: vi.fn((initialValue) => ({ value: initialValue })),
  useAnimatedStyle: vi.fn(() => ({})),
  withTiming: vi.fn((toValue) => toValue),
  withSpring: vi.fn((toValue) => toValue),
  withSequence: vi.fn((...args) => args[args.length - 1]),
  Easing: {
    linear: vi.fn(),
    ease: vi.fn(),
  },
}));

// Mock react-native-safe-area-context
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: 'SafeAreaProvider',
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: vi.fn(() => ({ top: 44, bottom: 34, left: 0, right: 0 })),
}));

// Mock nativewind
vi.mock('nativewind', () => ({
  styled: vi.fn((component) => component),
}));

// Mock @tanstack/react-query with test utilities
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    }),
    useMutation: vi.fn().mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    }),
    useQueryClient: vi.fn().mockReturnValue({
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
      clear: vi.fn(),
    }),
  };
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Freeze time for deterministic tests
vi.useFakeTimers();
