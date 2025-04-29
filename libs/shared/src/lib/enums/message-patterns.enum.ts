export enum MessagePatterns {
  // Auth Service Events
  AUTH_REGISTER = 'auth:register',
  AUTH_LOGIN = 'auth:login',
  AUTH_VALIDATE_TOKEN = 'auth:validate_token',
  AUTH_LOGOUT = 'auth:logout',
  AUTH_REFRESH_TOKEN = 'auth:refresh_token',

  // Admin Service Events
  ADMIN_CREATE_ITEM = 'admin:item:create',
  ADMIN_UPDATE_ITEM = 'admin:item:update',
  ADMIN_DELETE_ITEM = 'admin:item:delete',
  ADMIN_GET_ITEM = 'admin:item:get',
  ADMIN_LIST_ITEMS = 'admin:item:list',
  ADMIN_UPDATE_INVENTORY = 'admin:inventory:update',

  // User Service Events
  USER_GET_PROFILE = 'user:profile:get',
  USER_UPDATE_PROFILE = 'user:profile:update',
  USER_LIST_ORDERS = 'user:order:list',
  USER_GET_ORDER = 'user:order:get',
  USER_LIST_ITEMS = 'user:item:list',

  // User Events
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_GET = 'user:get',
  USER_GET_ALL = 'user:get_all',

  // Order Events
  ORDER_CREATE = 'order:create',
  ORDER_UPDATE = 'order:update',
  ORDER_DELETE = 'order:delete',
  ORDER_GET = 'order:get',
  ORDER_GET_ALL = 'order:get_all',
  ORDER_PROCESS = 'order:process',
  ORDER_COMPLETE = 'order:complete',
  ORDER_FAIL = 'order:fail',

  // Inventory Events
  INVENTORY_CHECK = 'inventory:check',
  INVENTORY_RESERVE = 'inventory:reserve',
  INVENTORY_RELEASE = 'inventory:release',
  INVENTORY_UPDATE = 'inventory:update',

  // Notification Events
  NOTIFICATION_ORDER_STATUS = 'notification:order_status',
  NOTIFICATION_INVENTORY_LOW = 'notification:inventory_low',
}
