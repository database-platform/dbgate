import { currentTheme } from './stores';

export interface MicroAppGlobalProps {
  layout?: MicroAppLayoutProps;
  permission?: {
    dataToken: string;
    token: string;
  };
}

export interface MicroAppLayoutProps {
  left: string;
  top: string;
  darkMode: boolean;
}

export function startMicroApp() {
  if (window.__MICRO_APP_ENVIRONMENT__) {
    window.microApp.addDataListener(fromMainAppData, true);
  }
}

function fromMainAppData(data: MicroAppGlobalProps) {
  try {
    if (data?.permission) {
      const { token, dataToken } = data?.permission;
      // localStorage.setItem('accessToken', dataToken);
      // localStorage.setItem('apiToken', token);
    }

    const rootStyle = window.document.documentElement.style;
    // const mainElColorPrimary = rootStyle.getPropertyValue('--el-color-primary');
    // const leftPanelWidth = rootStyle.getPropertyValue('--dim-left-panel-width');
    if (data?.layout) {
      const { layout } = data;
      rootStyle.setProperty('--dim-micro-app-left', layout.left);
      rootStyle.setProperty('--dim-micro-app-top', layout.top);
      currentTheme.update(() => (data.layout.darkMode ? 'theme-dark' : 'theme-light'));
    }
  } catch (error) {
    console.log('error ', error);
  }
  window.microApp.dispatch({ name: 'dbgate' }, () => {
    console.log('from dbgate dispatch over.');
  });
}
