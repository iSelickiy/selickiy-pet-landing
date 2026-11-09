export interface VaultSummary {
  name: string
  database: string
  documents: number
  sizeBytes: number
  status: 'ready'
}

export interface VaultAccessKit {
  name: string
  database: string
  username: string
  password: string
  encryptionPassphrase: string
  setupUri: string
  setupPassphrase: string
  recoveryCode: string
  expiresAt: string | null
}

export interface ServiceSummary {
  name: string
  image: string
  state: string
  status: string
}

export interface ServerOverview {
  resources: {
    memory: { total: number; used: number }
    disk: { total: number; used: number }
  }
  services: ServiceSummary[]
}

export type ContainerAction = 'start' | 'stop' | 'restart'
