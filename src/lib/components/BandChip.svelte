<script lang="ts">
  import { BANDS, type Band } from '$lib/blueprint';
  let { band }: { band: Band } = $props();
</script>

<span class="band" style="--bc:{BANDS[band].color}">{BANDS[band].label}</span>

<style>
  .band {
    display: inline-block;
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 900;
    color: var(--bc);
    background: color-mix(in srgb, var(--bc) 14%, transparent);
    border: 1.5px solid color-mix(in srgb, var(--bc) 55%, transparent);
    white-space: nowrap;
  }
</style>
