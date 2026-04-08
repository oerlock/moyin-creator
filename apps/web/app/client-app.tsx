'use client'

import App from '../../../src/App'
import { setupWebBridge } from './web-bridge'

setupWebBridge()

export default function ClientApp() {
  return <App />
}
