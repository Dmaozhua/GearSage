const getSystemTheme = () => {
  if (typeof wx === 'undefined' || !wx.getSystemInfoSync) {
    return null;
  }
  try {
    const { theme } = wx.getSystemInfoSync();
    return theme || null;
  } catch (error) {
    console.warn('[theme] Failed to get system theme:', error);
    return null;
  }
};

const getInitialDarkMode = () => {
  try {
    const app = typeof getApp === 'function' ? getApp() : null;
    if (app && app.globalData && typeof app.globalData.isDarkMode !== 'undefined') {
      return !!app.globalData.isDarkMode;
    }
  } catch (error) {
    console.warn('[theme] Failed to read app global dark mode:', error);
  }

  const systemTheme = getSystemTheme();
  return systemTheme === 'dark';
};

const subscribeThemeChange = (listener) => {
  if (typeof wx === 'undefined' || !wx.onThemeChange || typeof listener !== 'function') {
    return null;
  }
  wx.onThemeChange(listener);
  return listener;
};

const unsubscribeThemeChange = (listener) => {
  if (typeof wx === 'undefined' || !wx.offThemeChange || typeof listener !== 'function') {
    return;
  }
  wx.offThemeChange(listener);
};

module.exports = {
  getInitialDarkMode,
  subscribeThemeChange,
  unsubscribeThemeChange,
};
