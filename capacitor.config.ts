export interface CapacitorConfig {
  appId: string
  appName: string
  webDir: string
  server?: {
    androidScheme?: string
    [key: string]: unknown
  }
  plugins?: {
    LocalNotifications?: {
      smallIcon?: string
      iconColor?: string
      sound?: string
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  [key: string]: unknown
}

const config: CapacitorConfig = {
  appId: 'com.localproductivity.suite',
  appName: 'Productivity Suite',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_launcher_round',
      iconColor: '#0A7A64',
      sound: 'beep.wav'
    }
  }
}

export default config
