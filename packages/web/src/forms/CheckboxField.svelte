<label>
  <input class="checkbox" type="checkbox" {...$$restProps} on:change />
  <span class="checkmark" />
</label>

<style>
  .checkbox {
    opacity: 0;
    position: absolute;
    color: var(--theme-bg-0);
    outline: none;
    margin: 0;
    width: 0;
    height: 0;
    z-index: -1;
  }
  .checkmark {
    position: relative;
    left: 0;
    top: 0;
    width: 14px;
    height: 14px;
    border: 1px solid var(--theme-border);
    border-radius: 3px;
    display: inline-block;
  }
  .checkbox:checked + .checkmark {
    background-color: var(--theme-font-link);
    border: none;
  }
  .checkbox:checked + .checkmark::after {
    content: '';
    position: absolute;
    left: 4px;
    top: 2px;
    width: 6px;
    height: 9px;
    border: solid var(--theme-bg-0);
    border-width: 0 3px 3px 0;
    transform: rotate(45deg);
  }
</style>
