<script lang="ts">
  import keycodes from '../utility/keycodes';
  import _ from 'lodash';

  export let placeholder;
  export let value;
  export let styleName = '';

  $: searchValue = value || '';
  export let isDebounced = false;

  let domInput;

  function handleKeyDown(e) {
    if (e.keyCode == keycodes.escape) {
      value = '';
    }
  }

  const debouncedSet = _.debounce(x => (value = x), 500);
</script>

<input
  type="text"
  {placeholder}
  value={searchValue}
  style={styleName}
  on:input={e => {
    if (isDebounced) debouncedSet(domInput.value);
    else value = domInput.value;
  }}
  on:keydown={handleKeyDown}
  bind:this={domInput}
  on:focus={e => domInput.select()}
/>

<style>
  input {
    flex: 1;
    min-width: 10px;
    min-height: 22px;
    width: 10px;
    border: none;
    padding: 6px 8px 6px 24px;
    font-size: 13px;
    border-radius: 6px;
  }
</style>
