<script>
	import autoAnimate from '@formkit/auto-animate';
	import { onMount } from 'svelte';
	import { Eraser, Info, Trash, UserRoundPlus } from 'lucide-svelte';

	let users = $state([]);

	let isLoadingUsers = $state(false);

	let isSearching = $state(false);

	let deletingUserID = $state(0);

	let searchResults = $state([]);

	let searchInput;

	const FETCH_CACHE = new Map();

	const USERS_API = 'https://dummyjson.com/users/';

	function debounce(callback, wait = 300) {
		let timer;

		return (...args) => {
			clearTimeout(timer);

			timer = setTimeout(() => {
				callback(...args);
			}, wait);
		};
	}

	const searchUsers = debounce(async ({ target }) => {
		const query = target.value.toLowerCase();

		if (!query.trim()) {
			searchResults = [];
			return;
		}

		isSearching = true;

		if (FETCH_CACHE.has(query)) {
			console.log('Cached...');
			searchResults = FETCH_CACHE.get(query);
			isSearching = false;
			return;
		}

		fetch(`${USERS_API}search?q=${query}&limit=5`)
			.then((response) => response.json())
			.then((data) => {
				const { users } = data;

				console.log('Fetched...');
				FETCH_CACHE.set(query, users);
				searchResults = users;
			})
			.finally(() => {
				isSearching = false;
			});
	});

	const addUser = ({ currentTarget: { value } }) => {
		const user = searchResults.find(({ id }) => id === +value);
		users = [...users, user];
	};

	/* const showUser = ({
		currentTarget: {
			dataset: { id }
		}
	}) => {
		currentUser = users.find((user) => user.id === +id);
		modal.showModal();
	}; */

	const deleteUser = async ({ currentTarget }) => {
		const id = +currentTarget.dataset.id;
		deletingUserID = id;

		fetch(`${USERS_API}${id}`, {
			method: 'DELETE'
		})
			.then((res) => res.json())
			.then((data) => {
				const { isDeleted } = data;
				if (isDeleted) {
					console.log('Deleted');
					users = users.filter((user) => user.id !== id);
				}
			})
			.finally(() => {
				deletingUserID = 0;
			});
	};

	const loadUsers = async () => {
		const controller = new AbortController();
		const { signal } = controller;

		setTimeout(() => {
			controller.abort();
		}, 5000);

		fetch(`${USERS_API}?limit=5`, { signal })
			.then((response) => response.json())
			.then((data) => {
				users = data.users;
			})
			.finally(() => (isLoadingUsers = false));
	};

	onMount(() => {
		loadUsers();
	});
</script>

<h1>Users Demo</h1>

<!-- {#if isLoadingUsers}
	<div aria-busy={isLoadingUsers}>Loading</div>
{/if} -->
<search role="search">
	<input type="search" bind:this={searchInput} oninput={searchUsers} />
	<button
		aria-busy={isSearching}
		disabled={isSearching}
		type="button"
		onclick={() => {
			searchInput.value = '';
			searchResults = [];
		}}
	>
		{#if !isSearching}
			<Eraser />
		{/if}
	</button>
</search>
<div use:autoAnimate>
	{#if searchResults.length}
		<article>
			{#each searchResults as { id, firstName, lastName } (id)}
				<div role="group">
					<input type="text" value={`${firstName} ${lastName}`} readonly />
					<button
						type="button"
						value={id}
						disabled={users.find((user) => user.id === id)}
						onclick={addUser}><UserRoundPlus /></button
					>
				</div>
			{/each}
		</article>
	{/if}
</div>
{#if !isLoadingUsers}
	<table>
		<thead>
			<tr>
				<th scope="col">User</th>
				<th scope="col">Email</th>
				<th scope="col">Actions</th>
			</tr>
		</thead>
		<tbody use:autoAnimate>
			{#each users as { id, firstName, email } (id)}
				<tr>
					<td data-title="User">
						<label for={`user-${id}`}>{firstName}</label>
					</td>
					<td data-title="Email">
						<label for={`user-${id}`}>{email}</label>
					</td>
					<td data-title="Actions">
						<div role="group">
							<button
								class="secondary"
								type="button"
								data-id={id}
								aria-busy={deletingUserID === id}
								disabled={deletingUserID === id}
								onclick={deleteUser}
							>
								{#if deletingUserID !== id}
									<Trash />
								{/if}
							</button>
							<button type="button" data-id={id} disabled={deletingUserID === id}><Info /></button>
						</div>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="3">Sin usuarios</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	td:nth-child(3):last-child {
		text-align: right;

		@media (width <= 48rem) {
			text-align: initial;
		}
	}

	label {
		cursor: pointer;
	}

	@media (width <= 48rem) {
		thead {
			display: none;
		}

		tr {
			display: flex;
			flex-direction: column;
		}

		td::before {
			display: block;
			font-weight: bold;
			content: attr(data-title) ':';
		}
	}
</style>
