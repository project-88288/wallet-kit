import { InfoResponse } from "@terra-money/wallet-interface"
import axios from "axios"

export async function getInitialConfig() {
  const { data } = await axios.get<Record<string, InfoResponse>>(
    "https://dev.opzlabs.com/assets/chains.json"
  )
  return data.mainnet
}
