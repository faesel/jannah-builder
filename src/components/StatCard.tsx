import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <View style={styles.card} accessibilityLabel={`${label}: ${value}`}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E5DD',
    padding: 16,
    alignItems: 'center',
    minWidth: 140,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
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
