import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export const StatCard = React.memo(function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <View style={styles.card} accessibilityLabel={`${label}: ${value}`}>
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECE5',
    padding: 16,
    alignItems: 'center',
    minWidth: 140,
    ...Platform.select({
      ios: {
        shadowColor: '#2C4A3E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  iconContainer: {
    marginBottom: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C4A3E',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: '#8B9D83',
    textAlign: 'center',
  },
});
