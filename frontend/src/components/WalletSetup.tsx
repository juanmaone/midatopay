// Componente para configurar wallet persistente del comercio
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWalletManager } from '@/hooks/useWalletManager';
import { Wallet, Download, Upload, Eye, EyeOff, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export function WalletSetup() {
  const { generateWallet, saveWallet, login, logout, isConnected, wallet, exportWallet, importWallet, clearCorruptedWallets } = useWalletManager();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState('');

  // Registrar nueva wallet
  const handleRegister = async () => {
    if (!email || !password) {
      toast.error('Email y contraseña son requeridos');
      return;
    }

    try {
      setIsRegistering(true);
      const newWallet = generateWallet(email, password);
      await saveWallet(newWallet);
      toast.success('✅ Wallet creada exitosamente!');
      console.log('Nueva wallet:', newWallet);
    } catch (error) {
      toast.error('Error creando wallet');
      console.error('Error:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  // Login con wallet existente
  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Email y contraseña son requeridos');
      return;
    }

    try {
      setIsLoggingIn(true);
      const success = login(email, password);
      if (success) {
        toast.success('✅ Login exitoso!');
      } else {
        toast.error('Credenciales inválidas');
      }
    } catch (error) {
      toast.error('Error en login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Exportar wallet
  const handleExport = () => {
    const walletJson = exportWallet();
    if (walletJson) {
      const blob = new Blob([walletJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `midatopay-wallet-${wallet?.email || 'backup'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('✅ Wallet exportada');
    } else {
      toast.error('Error exportando wallet');
    }
  };

  // Importar wallet
  const handleImport = () => {
    if (!importData.trim()) {
      toast.error('Datos de importación requeridos');
      return;
    }

    try {
      const success = importWallet(importData);
      if (success) {
        toast.success('✅ Wallet importada exitosamente!');
        setShowImport(false);
        setImportData('');
      } else {
        toast.error('Error importando wallet');
      }
    } catch (error) {
      toast.error('Formato de wallet inválido');
    }
  };

  // Logout
  const handleLogout = () => {
    logout();
    toast.success('✅ Logout exitoso');
  };

  if (isConnected && wallet) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>Wallet Conectada</span>
          </CardTitle>
          <CardDescription>
            Comercio: {wallet.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Dirección:</Label>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
              {wallet.address}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Creada:</Label>
            <p className="text-sm text-gray-600">
              {new Date(wallet.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleExport} variant="outline" size="sm" className="flex-1">
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
            <Button onClick={handleLogout} variant="destructive" size="sm" className="flex-1">
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="w-5 h-5" />
          <span>Configurar Wallet</span>
        </CardTitle>
        <CardDescription>
          Genera o importa tu wallet persistente para el comercio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showImport ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">Email del Comercio</Label>
              <Input
                id="email"
                type="email"
                placeholder="comercio@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña segura"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={handleRegister} 
                disabled={isRegistering}
                className="flex-1"
              >
                {isRegistering ? 'Creando...' : 'Crear Wallet'}
              </Button>
              <Button 
                onClick={handleLogin} 
                variant="outline"
                disabled={isLoggingIn}
                className="flex-1"
              >
                {isLoggingIn ? 'Conectando...' : 'Conectar'}
              </Button>
            </div>

            <div className="text-center space-y-2">
              <Button 
                onClick={() => setShowImport(true)} 
                variant="ghost" 
                size="sm"
              >
                <Upload className="w-4 h-4 mr-1" />
                Importar Wallet
              </Button>
              <div>
                <Button 
                  onClick={clearCorruptedWallets} 
                  variant="destructive" 
                  size="sm"
                >
                  🧹 Limpiar Wallets Corruptas
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Datos de Wallet (JSON)</Label>
              <textarea
                className="w-full h-32 p-2 border rounded text-sm font-mono"
                placeholder="Pega aquí el JSON de tu wallet..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleImport} className="flex-1">
                Importar
              </Button>
              <Button 
                onClick={() => setShowImport(false)} 
                variant="outline" 
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
