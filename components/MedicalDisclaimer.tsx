/**
 * MedicalDisclaimer — Required disclaimer for any real health data display.
 * Shown before CGM connection and on screens displaying real glucose data.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

export const MedicalDisclaimer: React.FC<Props> = ({ onAccept, onDecline }) => (
  <View style={styles.container}>
    <Text style={styles.icon}>⚕️</Text>
    <Text style={styles.title}>IMPORTANT HEALTH NOTICE</Text>

    <View style={styles.body}>
      <Text style={styles.text}>
        Sukari includes a <Text style={styles.bold}>practice experience</Text> and is not a medical device.
      </Text>
      <Text style={styles.text}>
        • This app does NOT provide medical advice{'\n'}
        • Never make treatment decisions based on this app{'\n'}
        • Always follow your healthcare provider&apos;s guidance{'\n'}
        • In an emergency, call your local emergency number
      </Text>
      <Text style={styles.text}>
        By connecting your CGM, you consent to read-only access to your glucose data for educational display only. Your data is never shared with third parties.
      </Text>
    </View>

    <TouchableOpacity onPress={onAccept} style={styles.acceptBtn} accessibilityRole="button" accessibilityLabel="I understand, connect my CGM">
      <Text style={styles.acceptText}>I Understand — Connect My CGM</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onDecline} style={styles.declineBtn} accessibilityRole="button" accessibilityLabel="Not now">
      <Text style={styles.declineText}>Not Now</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { backgroundColor: '#0a0a12', padding: 24, borderRadius: 20, borderWidth: 2, borderColor: '#3b82f6', alignItems: 'center', maxWidth: 380 },
  icon: { fontSize: 40, marginBottom: 12 },
  title: { color: '#60a5fa', fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  body: { backgroundColor: 'rgba(59,130,246,0.1)', padding: 16, borderRadius: 12, marginBottom: 20, width: '100%' },
  text: { color: '#d1d5db', fontSize: 13, lineHeight: 20, marginBottom: 10 },
  bold: { fontWeight: 'bold', color: '#fff' },
  acceptBtn: { backgroundColor: '#2563eb', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', marginBottom: 8 },
  acceptText: { color: '#fff', fontWeight: 'bold', fontSize: 15, textAlign: 'center' },
  declineBtn: { paddingVertical: 10, paddingHorizontal: 24, width: '100%' },
  declineText: { color: '#6b7280', fontSize: 13, textAlign: 'center' },
});
