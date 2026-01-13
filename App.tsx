/**
 * Ear Training Mobile App
 */

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  HomeScreen,
  IntervalConfigScreen,
  IntervalQuizScreen,
  IntervalLearnScreen
} from './src/screens';
import { colors } from './src/theme';
import { EnabledIntervals } from './src/core/theory/intervals';

export type RootStackParamList = {
  Home: undefined;
  IntervalConfig: undefined;
  IntervalQuiz: { intervals: EnabledIntervals; direction: 'ascending' | 'descending' | 'both'; sustainDuration: number };
  IntervalLearn: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="IntervalConfig" component={IntervalConfigScreen} />
          <Stack.Screen name="IntervalQuiz" component={IntervalQuizScreen} />
          <Stack.Screen name="IntervalLearn" component={IntervalLearnScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
