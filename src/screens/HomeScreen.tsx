import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMusic, faBolt } from '@fortawesome/free-solid-svg-icons';
import { Button } from '../components';
import { colors, spacing, fontSize } from '../theme';

type RootStackParamList = {
  Home: undefined;
  IntervalConfig: undefined;
  IntervalLearn: undefined;
};

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
}

export function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <FontAwesomeIcon icon={faMusic as any} size={48} color={colors.gray600} />
        </View>
        <Text style={styles.title}>Hearo</Text>
        <Text style={styles.subtitle}>Train your ear to recognize musical intervals</Text>

        <View style={styles.buttons}>
          <Button size="lg" onPress={() => navigation.navigate('IntervalConfig')}>
            Interval Test
          </Button>
          <Button size="lg" variant="secondary" onPress={() => navigation.navigate('IntervalLearn')}>
            Learn
          </Button>
        </View>
      </View>
      <View style={styles.poweredBy}>
        <FontAwesomeIcon icon={faBolt as any} size={12} color={colors.gray600} />
        <Text style={styles.poweredByText}>powered by apobilici</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  icon: { marginBottom: spacing.lg },
  title: { fontSize: fontSize.xxxl, fontWeight: '300', color: colors.gray200, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.gray500, marginBottom: spacing.xxl, textAlign: 'center' },
  buttons: { gap: spacing.md, width: '100%', maxWidth: 280 },
  poweredBy: { position: 'absolute', bottom: spacing.lg, right: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  poweredByText: { color: colors.gray600, fontSize: fontSize.xs },
});
