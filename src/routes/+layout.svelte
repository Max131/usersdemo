<script>
	import './app.scss';
	const { children } = $props();
</script>

<div class="container">
	{@render children?.()}
</div>

<style>
	.container {
		padding-top: 2rem;
	}
</style>
