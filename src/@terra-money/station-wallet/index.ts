import { EventTypes, Wallet } from '@terra-money/wallet-interface'
import { CreateTxOptions, Tx } from '@terra-money/feather.js'
import Station from '@terra-money/station-connector'

declare global {
  interface Window {
    station?: Station
  }
}

export default class StationWallet implements Wallet {
  async info() {
    await this._waitWindowLoad()
    this.assureStationWalletIsAvailable()

    return await window.station.info()
  }

  async connect() {
    await this._waitWindowLoad()
    this.assureStationWalletIsAvailable()

    return await window.station.connect()
  }

  async getPubkey() {
    await this._waitWindowLoad()
    this.assureStationWalletIsAvailable()

    return await window.station.getPublicKey()
  }

  async post(tx: CreateTxOptions) {
    await this._waitWindowLoad()
    this.assureStationWalletIsAvailable()

    // is the chain classic?
    const networks = await this.info()
    const isClassic = !!networks[tx.chainID]?.isClassic

    const data = JSON.parse(
      JSON.stringify({
        ...tx,
        ...(tx.fee ? { fee: JSON.stringify(tx.fee.toData()) } : {}),
        msgs: tx.msgs.map((msg) => JSON.stringify(msg.toData(isClassic))),
      }),
    )

    return await window.station.post(data)
  }

  async sign(tx: CreateTxOptions) {
    await this._waitWindowLoad()
    this.assureStationWalletIsAvailable()

    // is the chain classic?
    const networks = await this.info()
    const isClassic = !!networks[tx.chainID]?.isClassic

    const data = JSON.parse(
      JSON.stringify({
        ...tx,
        ...(tx.fee ? { fee: JSON.stringify(tx.fee.toData()) } : {}),
        msgs: tx.msgs.map((msg) => JSON.stringify(msg.toData(isClassic))),
      }),
    )

    return await window.station.sign(data)
  }

  private listeners: Record<string, ((e: any) => void)[]> = {}

  addListener(event: EventTypes, cb: (data: any) => void) {
    const listener = (e: any) => cb(e.detail)
    this.listeners[event] = [...(this.listeners[event] ?? []), listener]

    switch (event) {
      case EventTypes.NetworkChange:
        window.addEventListener('station_network_change', listener)
        break
      case EventTypes.WalletChange:
        window.addEventListener('station_wallet_change', listener)
        break
    }
  }

  removeListener(event: EventTypes, _?: (data: any) => void) {
    const listeners = this.listeners[event]
    if (!listeners) return

    switch (event) {
      case EventTypes.NetworkChange:
        listeners.map((l) =>
          window.removeEventListener('station_network_change', l),
        )
        break
      case EventTypes.WalletChange:
        listeners.map((l) =>
          window.removeEventListener('station_wallet_change', l),
        )
        break
    }

    delete this.listeners[event]
  }

  isInstalled = !!window?.station

  id = 'station-extension'

  details = {
    name: 'Station (Extension)',
    icon: 'https://station-assets.terra.dev/img/station.png',
    website: 'https://setup.station.money/',
  }

  // helpers
  private assureStationWalletIsAvailable(): void {
    if (!window.station) throw new Error('Station extension not installed')
    // station.terra.money has a div with id station
    if (window.station instanceof HTMLElement) throw new Error('Station extension not installed') 
  }

  private async _waitWindowLoad() {
    if (document.readyState === 'complete') return

    return new Promise((resolve) => {
      const documentStateChange = (event: Event) => {
        if (
          event.target &&
          (event.target as Document).readyState === 'complete'
        ) {
          resolve(undefined)
          document.removeEventListener('readystatechange', documentStateChange)
        }
      }

      document.addEventListener('readystatechange', documentStateChange)
    })
  }
}
