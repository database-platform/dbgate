import { currentTheme } from './stores';

export interface MicroAppGlobalProps {
  layout?: MicroAppLayoutProps;
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
  console.log('from main app data2: ', data);
  try {
    const rootStyle = window.document.documentElement.style;
    const mainElColorPrimary = rootStyle.getPropertyValue('--el-color-primary');
    const leftPanelWidth = rootStyle.getPropertyValue('--dim-left-panel-width');
    console.log('rootStyle : ', mainElColorPrimary, leftPanelWidth);

    if (data && data.layout) {
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
