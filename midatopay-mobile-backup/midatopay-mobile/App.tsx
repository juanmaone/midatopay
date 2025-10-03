import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Componente principal de la wallet
function MidatoPayWallet() {
  // Funciones temporales (sin Cavos por ahora)
  const handleAppleLogin = () => {
    Alert.alert('🚀 Próximamente', 'Login con Apple disponible con Cavos Aegis');
  };

  const handleGoogleLogin = () => {
    Alert.alert('🚀 Próximamente', 'Login con Google disponible con Cavos Aegis');
  };

  const handleCreateWallet = () => {
    Alert.alert('🚀 Próximamente', 'Creación de wallet automática disponible con Cavos Aegis');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🇦🇷 MidatoPay</Text>
      <Text style={styles.subtitle}>Pagá con cripto de forma simple</Text>

      <View style={styles.loginContainer}>
        <TouchableOpacity style={styles.appleButton} onPress={handleAppleLogin}>
          <Text style={styles.buttonText}>🍎 Continuar con Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
          <Text style={styles.buttonText}>📱 Continuar con Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.walletButton} onPress={handleCreateWallet}>
          <Text style={styles.buttonText}>💎 Crear Wallet Nueva</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.demoContainer}>
        <Text style={styles.demoText}>
          📱 Esta es la app móvil de MidatoPay
        </Text>
        <Text style={styles.demoText}>
          🔗 Con Cavos Aegis integrado
        </Text>
      </View>

      <Text style={styles.footerText}>
        Powered by Starknet + Cavos Aegis
      </Text>

      <StatusBar style="auto" />
    </View>
  );
}

// App principal (sin AegisProvider temporalmente)
export default function App() {
  return <MidatoPayWallet />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fe6c1c',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#5d5d5d',
    marginBottom: 40,
    textAlign: 'center',
  },
  loginContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
    marginBottom: 20,
  },
  appleButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  walletButton: {
    backgroundColor: '#fe6c1c',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  demoContainer: {
    backgroundColor: 'rgba(254, 108, 28, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  demoText: {
    color: '#fe6c1c',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  footerText: {
    color: '#5d5d5d',
    fontSize: 12,
    marginTop: 40,
    textAlign: 'center',
  },
});