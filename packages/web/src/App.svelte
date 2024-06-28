<script lang="ts">
  import { onMount } from 'svelte';

  import CommandListener from './commands/CommandListener.svelte';
  import DataGridRowHeightMeter from './datagrid/DataGridRowHeightMeter.svelte';
  import LoadingInfo from './elements/LoadingInfo.svelte';

  import PluginsProvider from './plugins/PluginsProvider.svelte';
  import Screen from './Screen.svelte';
  import { loadingPluginStore, subscribeApiDependendStores } from './stores';
  import { setAppLoaded } from './utility/appLoadManager';
  import ErrorHandler from './utility/ErrorHandler.svelte';
  import OpenTabsOnStartup from './utility/OpenTabsOnStartup.svelte';
  // import { shouldWaitForElectronInitialize } from './utility/getElectron';
  import { subscribeConnectionPingers } from './utility/connectionsPinger';
  import { subscribePermissionCompiler } from './utility/hasPermission';
  import { apiCall } from './utility/api';
  import { getConfig, getSettings, getUsedApps } from './utility/metadataLoaders';
  import AppTitleProvider from './utility/AppTitleProvider.svelte';
  import getElectron from './utility/getElectron';
  import AppStartInfo from './widgets/AppStartInfo.svelte';
  import SettingsListener from './utility/SettingsListener.svelte';
  import { handleAuthOnStartup, handleOauthCallback } from './clientAuth';
  import { startMicroApp } from './microApp';

  let loadedApi = false;
  let loadedPlugins = false;
  let message = 'Start SQL Editor';
  let retries = 3;
  async function loadApi() {
    // if (shouldWaitForElectronInitialize()) {
    //   setTimeout(loadApi, 100);
    //   return;
    // }

    try {
      // console.log('************** LOADING API');

      const config = await getConfig();
      await handleAuthOnStartup(config);

      const connections = await apiCall('connections/list');
      const settings = await getSettings();
      const apps = await getUsedApps();
      loadedApi = settings && connections && config && apps;

      if (loadedApi) {
        subscribeApiDependendStores();
        subscribeConnectionPingers();
        subscribePermissionCompiler();
      }

      if (!loadedApi) {
        if (retries === 0) {
          message = 'Retry limit reached, stoped.';
        } else {
          retries--;
          message = `API not initialized correctly, trying again in 2s, Retrying... Attempts left: ${retries}`;
          console.log(message);
          setTimeout(loadApi, 2000);
        }
      }
    } catch (err) {
      if (retries === 0) {
        message = 'Retry limit reached, stoped.';
      } else {
        retries--;
        message = `Error calling API, trying again in 2s, Retrying... Attempts left: ${retries}`;
        console.log(message);
        setTimeout(loadApi, 2000);
      }
    }
  }

  onMount(loadApi);

  onMount(() => {
    const removed = document.getElementById('starting_dbgate_zero');
    if (removed) removed.remove();
  });

  onMount(() => {
    console.log('app mount.', window.__MICRO_APP_ENVIRONMENT__);
    if (window.__MICRO_APP_ENVIRONMENT__) {
      startMicroApp();
    }
  });

  $: {
    if (loadedApi && $loadingPluginStore?.loaded) {
      setAppLoaded();
      loadedPlugins = true;
      getElectron()?.send('app-started');
    }
  }
</script>

<ErrorHandler />

{#if loadedApi}
  <DataGridRowHeightMeter />
  <CommandListener />
  <PluginsProvider />
  <AppTitleProvider />
  {#if loadedPlugins}
    <OpenTabsOnStartup />
    <SettingsListener />
    <Screen />
  {:else}
    <AppStartInfo
      message={$loadingPluginStore.loadingPackageName
        ? `Loading plugin ${$loadingPluginStore.loadingPackageName} ...`
        : 'Preparing plugins ...'}
    />
  {/if}
{:else}
  <AppStartInfo {message} />
{/if}
