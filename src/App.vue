<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useLocaleStore } from '@/stores/locale'

onLaunch(() => {
  useLocaleStore().applyTabBarLabels()
  console.info('SIOGES UniApp launched')
})
</script>

<style>
page { min-height: 100%; background: #f4f6f8; color: #20252b; font-family: Arial, sans-serif; }
button { margin: 0; }
</style>
