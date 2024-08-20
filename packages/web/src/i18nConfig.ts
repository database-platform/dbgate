import { get } from 'svelte/store';
import { t } from 'svelte-i18n';

export function translate(key, option = {}) {
  return get(t)(key, option);
}
