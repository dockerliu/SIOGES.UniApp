import { defineStore } from 'pinia'

export type AppLanguage = 'zh' | 'es'

const STORAGE_KEY = 'sioges.language'

const translations: Record<AppLanguage, Record<string, string>> = {
  zh: {
    'tab.home': '桌态', 'tab.menu': '点餐', 'tab.pickup': '订单', 'tab.user': '我的',
    'language.title': '语言 / Idioma', 'language.chinese': '中文', 'language.spanish': 'Español',
    'home.eyebrow': 'SIOGES TPV', 'home.title': '厅房与餐桌', 'common.refresh': '刷新',
    'home.tablesCount': '张餐桌', 'home.zone': '厅房', 'home.readError': '读取桌态失败：',
    'home.loading': '正在加载餐桌…', 'home.occupied': '占用', 'home.free': '空闲',
    'home.startHint': '点击开始点餐', 'home.elapsedHours': '小时', 'home.elapsedMinutes': '分',
    'home.continue': '继续加菜', 'home.viewOrder': '查看订单', 'home.startOrder': '开始点餐',
    'home.startQuestion': '要为 {table} 开始点餐吗？桌台将在送出第一笔订单后开台。',
    'home.goOrder': '去点餐', 'menu.noTable': '未选择餐桌', 'menu.search': '搜索菜品 / Buscar',
    'menu.notice': '当前桌下单将发送至 SIOGES 收银系统', 'menu.checkTable': '正在确认餐桌…',
    'menu.missingTable': '还没有选择餐桌', 'menu.selectFirst': '先从桌态页选择一张餐桌，再开始点餐。',
    'menu.selectTable': '去选择餐桌', 'menu.loading': '正在加载菜品…', 'menu.noProducts': '没有找到菜品',
    'menu.options': '可选规格 {count} 项', 'menu.number': '编号 {id}', 'menu.chooseOptions': '选规格', 'menu.noPrice': '暂无价格',
    'menu.noPriceForTable': '该桌没有此菜品的价目', 'menu.selected': '已选：{count} 份',
    'menu.total': '总计：', 'menu.done': '选好了', 'menu.needLogin': '需要店员登录',
    'menu.loginBeforeSubmit': '请先登录 SIOGES 店员账号，再提交订单。购物车会保留。',
    'menu.goLogin': '去登录', 'menu.loginExpired': '登录已过期', 'menu.loginAgain': '请重新登录后提交订单，购物车内容仍会保留。',
    'menu.specTitle': '选规格', 'menu.note': '备注（最多 40 字）', 'menu.notePlaceholder': '口味或制作要求',
    'menu.addCart': '加入购物车', 'menu.cartSent': '送单成功', 'menu.cartSelected': '已选菜品',
    'menu.cartEmpty': '购物车还是空的', 'menu.covers': '就餐人数', 'menu.sendFailed': '送单失败：',
    'menu.unpriced': '有菜品没有此桌价目，暂不能送单。', 'menu.sending': '正在送单…',
    'menu.confirmSend': '确认送单 · {total}', 'menu.finish': '完成', 'menu.receiptSent': '订单已送至收银系统',
    'order.title': '当前桌订单', 'order.noTable': '尚未选择餐桌', 'order.interval': '每 20 秒更新',
    'order.loginRequired': '登录后查看订单', 'order.loginHint': '请使用 SIOGES 店员工号登录，再查看未结票据或操作订单。',
    'order.loading': '正在读取订单…', 'order.selectTableHint': '请先选择餐桌，只显示当前桌的已送单明细。',
    'order.selectTable': '选择餐桌', 'order.noOpen': '暂无未结订单。', 'order.items': '项',
    'order.people': '位', 'order.ticket': '票号', 'order.tableFallback': '桌 {id}', 'order.timeUnknown': '时间未知',
    'order.urgent': '催菜', 'order.transfer': '换台', 'order.urgentDone': '已催菜：{table} · {id}',
    'order.noTarget': '目前没有空闲餐桌可换。', 'order.transferDone': '已将 {source} 的订单换至 {target}',
    'order.readFailed': '读取订单失败：', 'common.retry': '重试', 'order.itemFallback': '菜品 {id}',
    'user.title': '我的', 'user.caption': '员工账号与个人资料', 'user.staffAccount': '店员账户',
    'user.avatarFallback': '员',
    'user.loginForOrders': '登录后可以操作订单', 'user.loggedIn': '已登录', 'user.notLoggedIn': '未登录',
    'user.savedSession': '登录状态会保存在本机，退出后需要重新验证。',
    'user.loginHint': '使用 SIOGES 中已启用的店员工号登录；未设置密码的账号可以留空。',
    'user.login': '店员登录', 'user.verify': '使用收银系统账号验证', 'user.staffCode': '店员工号',
    'user.staffCodePlaceholder': '输入 SIOGES 店员工号', 'user.password': '密码',
    'user.passwordPlaceholder': '输入登录密码（可留空）', 'user.verifying': '正在验证…',
    'user.loginButton': '登录', 'user.currentAccount': '当前账号', 'user.orderAudit': '订单操作将记录为此店员',
    'user.staffName': '员工姓名', 'user.staffId': '员工编号', 'user.unknown': '未填写',
    'user.logout': '退出登录', 'user.processing': '处理中…', 'user.middleware': '中间件连接',
    'user.middlewareHint': '配置运行 SIOGES API 的电脑', 'user.apiAddress': 'API 地址',
    'user.apiPlaceholder': 'http://192.168.1.200:5000', 'user.testing': '正在测试…',
    'user.saveTest': '保存并测试连接', 'user.menuData': '菜品数据',
    'user.menuRefreshHint': '刷新当前餐桌菜单与规格', 'user.sync': '同步',
    'user.loginExpired': '登录已过期，请重新登录。', 'user.loginSuccess': '登录成功',
    'user.logoutDone': '已退出登录', 'user.savedAddress': '中间件地址已保存在本机',
    'user.chooseTableFirst': '请先选择餐桌，再同步菜单。', 'user.menuUpdated': '菜单与规格已刷新',
    'user.testingConnection': '正在测试中间件…', 'user.connectionOk': '连接正常，数据库已连接',
    'user.databaseError': '服务可访问，但数据库状态异常',
    'user.settings': '设置', 'user.settingsHint': '语言、连接与菜单同步',
    'settings.title': '设置', 'settings.subtitle': '应用语言与 SIOGES 连接',
    'settings.connectionNote': '浏览器预览时，127.0.0.1 指运行浏览器的这台电脑；手机或其他设备请填写服务器的局域网 IP。',
    'settings.notTested': '尚未测试', 'settings.connecting': '正在连接…',
  },
  es: {
    'tab.home': 'Mesas', 'tab.menu': 'Menú', 'tab.pickup': 'Pedidos', 'tab.user': 'Mi cuenta',
    'language.title': 'Idioma / 语言', 'language.chinese': '中文', 'language.spanish': 'Español',
    'home.eyebrow': 'SIOGES TPV', 'home.title': 'Salas y mesas', 'common.refresh': 'Actualizar',
    'home.tablesCount': 'mesas', 'home.zone': 'Sala', 'home.readError': 'No se pudo leer el estado: ',
    'home.loading': 'Cargando mesas…', 'home.occupied': 'Ocupada', 'home.free': 'Libre',
    'home.startHint': 'Toca para pedir', 'home.elapsedHours': 'h', 'home.elapsedMinutes': 'min',
    'home.continue': 'Añadir productos', 'home.viewOrder': 'Ver pedido', 'home.startOrder': 'Empezar pedido',
    'home.startQuestion': '¿Empezar un pedido para {table}? La mesa se abrirá al enviar el primer pedido.',
    'home.goOrder': 'Ir al menú', 'menu.noTable': 'Ninguna mesa seleccionada', 'menu.search': 'Buscar productos',
    'menu.notice': 'El pedido de esta mesa se enviará al TPV SIOGES', 'menu.checkTable': 'Comprobando mesa…',
    'menu.missingTable': 'No has seleccionado una mesa', 'menu.selectFirst': 'Selecciona una mesa antes de empezar el pedido.',
    'menu.selectTable': 'Elegir mesa', 'menu.loading': 'Cargando productos…', 'menu.noProducts': 'No se encontraron productos',
    'menu.options': '{count} opciones', 'menu.number': 'Código {id}', 'menu.chooseOptions': 'Opciones', 'menu.noPrice': 'Sin precio',
    'menu.noPriceForTable': 'Este producto no tiene precio para esta mesa', 'menu.selected': 'Elegidos: {count}',
    'menu.total': 'Total: ', 'menu.done': 'Listo', 'menu.needLogin': 'Inicio de sesión requerido',
    'menu.loginBeforeSubmit': 'Inicia sesión con tu cuenta de empleado antes de enviar el pedido. El carrito se conservará.',
    'menu.goLogin': 'Iniciar sesión', 'menu.loginExpired': 'Sesión caducada', 'menu.loginAgain': 'Inicia sesión de nuevo para enviar el pedido. El carrito se conservará.',
    'menu.specTitle': 'Elegir opciones', 'menu.note': 'Nota (máx. 40 caracteres)', 'menu.notePlaceholder': 'Preferencias o preparación',
    'menu.addCart': 'Añadir al carrito', 'menu.cartSent': 'Pedido enviado', 'menu.cartSelected': 'Productos elegidos',
    'menu.cartEmpty': 'El carrito está vacío', 'menu.covers': 'Comensales', 'menu.sendFailed': 'Error al enviar: ',
    'menu.unpriced': 'Hay productos sin precio para esta mesa.', 'menu.sending': 'Enviando…',
    'menu.confirmSend': 'Confirmar · {total}', 'menu.finish': 'Terminar', 'menu.receiptSent': 'Pedido enviado al TPV',
    'order.title': 'Pedido de esta mesa', 'order.noTable': 'Ninguna mesa seleccionada', 'order.interval': 'Actualización cada 20 s',
    'order.loginRequired': 'Inicia sesión para ver los pedidos', 'order.loginHint': 'Usa tu cuenta de empleado SIOGES para consultar y gestionar pedidos abiertos.',
    'order.loading': 'Cargando pedido…', 'order.selectTableHint': 'Selecciona una mesa para ver solo sus productos enviados.',
    'order.selectTable': 'Elegir mesa', 'order.noOpen': 'No hay pedidos abiertos.', 'order.items': 'productos',
    'order.people': 'personas', 'order.ticket': 'Ticket', 'order.tableFallback': 'Mesa {id}', 'order.timeUnknown': 'Hora desconocida',
    'order.urgent': 'Reclamar', 'order.transfer': 'Cambiar mesa', 'order.urgentDone': 'Aviso enviado: {table} · {id}',
    'order.noTarget': 'No hay mesas libres disponibles.', 'order.transferDone': 'Pedido movido de {source} a {target}',
    'order.readFailed': 'Error al leer pedidos: ', 'common.retry': 'Reintentar', 'order.itemFallback': 'Producto {id}',
    'user.title': 'Mi cuenta', 'user.caption': 'Acceso y perfil de empleado', 'user.staffAccount': 'Cuenta de empleado',
    'user.avatarFallback': 'E',
    'user.loginForOrders': 'Inicia sesión para gestionar pedidos', 'user.loggedIn': 'Conectado', 'user.notLoggedIn': 'Desconectado',
    'user.savedSession': 'La sesión se guarda en este dispositivo; al salir tendrás que identificarte de nuevo.',
    'user.loginHint': 'Inicia sesión con un empleado activo de SIOGES. La contraseña puede dejarse vacía si no está configurada.',
    'user.login': 'Acceso de empleado', 'user.verify': 'Verificar cuenta del TPV', 'user.staffCode': 'Código de empleado',
    'user.staffCodePlaceholder': 'Introduce el código de empleado', 'user.password': 'Contraseña',
    'user.passwordPlaceholder': 'Contraseña (opcional)', 'user.verifying': 'Verificando…',
    'user.loginButton': 'Entrar', 'user.currentAccount': 'Cuenta actual', 'user.orderAudit': 'Las operaciones quedarán registradas a este empleado',
    'user.staffName': 'Nombre', 'user.staffId': 'Código', 'user.unknown': 'Sin indicar',
    'user.logout': 'Cerrar sesión', 'user.processing': 'Procesando…', 'user.middleware': 'Conexión del middleware',
    'user.middlewareHint': 'Configura el ordenador que ejecuta SIOGES API', 'user.apiAddress': 'Dirección API',
    'user.apiPlaceholder': 'http://192.168.1.200:5000', 'user.testing': 'Probando…',
    'user.saveTest': 'Guardar y probar conexión', 'user.menuData': 'Datos del menú',
    'user.menuRefreshHint': 'Actualizar menú y opciones de la mesa actual', 'user.sync': 'Sincronizar',
    'user.loginExpired': 'La sesión ha caducado. Inicia sesión de nuevo.', 'user.loginSuccess': 'Sesión iniciada',
    'user.logoutDone': 'Sesión cerrada', 'user.savedAddress': 'Dirección del middleware guardada',
    'user.chooseTableFirst': 'Selecciona una mesa antes de sincronizar el menú.', 'user.menuUpdated': 'Menú y opciones actualizados',
    'user.testingConnection': 'Probando el middleware…', 'user.connectionOk': 'Conexión correcta; base de datos conectada',
    'user.databaseError': 'Servicio accesible, pero la base de datos tiene un problema',
    'user.settings': 'Ajustes', 'user.settingsHint': 'Idioma, conexión y menú',
    'settings.title': 'Ajustes', 'settings.subtitle': 'Idioma y conexión con SIOGES',
    'settings.connectionNote': 'En el navegador, 127.0.0.1 se refiere a este equipo. En móviles, indica la IP local del servidor.',
    'settings.notTested': 'Sin probar', 'settings.connecting': 'Conectando…',
  },
}

function storedLanguage(): AppLanguage {
  try { return uni.getStorageSync(STORAGE_KEY) === 'es' ? 'es' : 'zh' } catch { return 'zh' }
}

export const useLocaleStore = defineStore('locale', {
  state: () => ({ language: storedLanguage() as AppLanguage }),
  actions: {
    t(key: string, values: Record<string, string | number> = {}) {
      let text = translations[this.language][key] ?? translations.zh[key] ?? key
      for (const [name, value] of Object.entries(values)) text = text.replace(`{${name}}`, String(value))
      return text
    },
    setLanguage(language: AppLanguage) {
      this.language = language
      uni.setStorageSync(STORAGE_KEY, language)
      this.applyTabBarLabels()
      uni.setNavigationBarTitle({ title: this.t('settings.title') })
    },
    applyTabBarLabels() {
      const labels = ['tab.home', 'tab.menu', 'tab.pickup', 'tab.user']
      labels.forEach((key, index) => uni.setTabBarItem({ index, text: this.t(key) }))
      uni.setTabBarStyle({ color: '#777980', selectedColor: '#d93035', backgroundColor: '#f8f8f8', borderStyle: 'black' })
    },
  },
})
