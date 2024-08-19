import { addMessages, init } from 'svelte-i18n';
import en from './locales/en-US.json';
import zh from './locales/zh-CN.json';

// register('en', () => en);
// register('en-US', () => en);
// register('cn', () => zh);

addMessages('cn', zh);
addMessages('en', en);

init({
  fallbackLocale: 'en',
  initialLocale: 'cn',
  // initialLocale: getLocaleFromNavigator(),
});
