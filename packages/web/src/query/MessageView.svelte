<script lang="ts" context="module">
  function formatDuration(duration) {
    if (duration == 0) return '0';
    if (duration < 1000) {
      return `${Math.round(duration)} ms`;
    }
    if (duration < 10000) {
      return `${Math.round(duration / 100) / 10} s`;
    }
    return `${Math.round(duration / 1000)} s`;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { t } from 'svelte-i18n';
  import moment from 'moment';
  import { apiCall } from '../utility/api';
  import localforage from 'localforage';

  export let eventName = '';
  export let items: any[];
  export let showProcedure = false;
  export let showLine = false;
  export let startLine = 0;

  $: time0 = items[0] && new Date(items[0].time).getTime();

  const dispatch = createEventDispatcher();

  async function saveLog() {
    console.log('items ', items, eventName);
    if (!eventName) {
      return;
    }
    try {
      const sql = await localforage.getItem(eventName);
      await apiCall('sessions/save-logs', {
        sesid: eventName.split('session-info-')[1],
        sql,
        message: JSON.stringify(items),
      });
      localforage.removeItem(eventName);
    } catch (err) {}
  }

  $: {
    if (items.length > 1 && eventName) {
      saveLog();
    }
  }
</script>

<div class="main">
  <table>
    <tr>
      <td class="header">{$t('widgets.query.message.table.number')}</td>
      <td class="header">{$t('widgets.query.message.table.message')}</td>
      <td class="header">{$t('widgets.query.message.table.time')}</td>
      <td class="header">{$t('widgets.query.message.table.delta')}</td>
      <td class="header">{$t('widgets.query.message.table.duration')}</td>
      {#if showProcedure}
        <td class="header">{$t('widgets.query.message.table.procedure')}</td>
      {/if}
      {#if showLine}
        <td class="header">{$t('widgets.query.message.table.line')}</td>
      {/if}
    </tr>
    {#each items as row, index}
      <tr
        class:isError={row.severity == 'error'}
        class:isActive={row.line}
        on:click={() => dispatch('messageclick', row)}
      >
        <td>{index + 1}</td>
        <td>{row.message}</td>
        <td>{moment(row.time).format('HH:mm:ss')}</td>
        <td>{formatDuration(new Date(row.time).getTime() - time0)}</td>
        <td>
          {index > 0
            ? formatDuration(new Date(row.time).getTime() - new Date(items[index - 1].time).getTime())
            : 'n/a'}</td
        >
        {#if showProcedure}
          <td>{row.procedure || ''}</td>
        {/if}
        {#if showLine}
          <td>{row.line == null ? '' : row.line + 1 + startLine}</td>
        {/if}
      </tr>
    {/each}
  </table>
</div>

<style>
  .main {
    flex: 1;
    display: flex;
    position: relative;
    overflow-y: scroll;
    background-color: var(--theme-bg-0);
  }
  table {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    width: 100%;
    border-spacing: 0;
    border-collapse: collapse;
  }
  td.header {
    text-align: left;
    border-bottom: 2px solid var(--theme-border);
    background-color: var(--theme-bg-1);
    padding: 5px;
  }
  td:not(.header) {
    border-top: 1px solid var(--theme-border);
    padding: 5px;
  }
  tr.isActive:hover {
    background: var(--theme-bg-2);
  }
  tr.isError {
    color: var(--theme-icon-red);
  }
</style>
