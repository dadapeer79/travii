import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const cesiumBaseUrl = 'cesium'
const cesiumAssets = (folder) => `node_modules/cesium/Build/Cesium/${folder}/**/*.*`

// https://vite.dev/config/
export default defineConfig({
  define: { CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}`) },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: cesiumAssets('Workers'), dest: `${cesiumBaseUrl}/Workers` },
        { src: cesiumAssets('ThirdParty'), dest: `${cesiumBaseUrl}/ThirdParty` },
        { src: cesiumAssets('Assets'), dest: `${cesiumBaseUrl}/Assets` },
        { src: cesiumAssets('Widgets'), dest: `${cesiumBaseUrl}/Widgets` },
      ],
    }),
  ],
})
