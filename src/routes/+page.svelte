<script>
	import { fade, fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { Eraser, Info, Trash, UserRoundPlus } from 'lucide-svelte';

	let users = $state([]);

	let isLoadingUsers = $state(true);

	let isSearching = $state(false);

	let deletingUserID = $state(0);

	let searchResults = $state([]);

	let searchInput;

	const QUERY_CACHE = new Set();
	let USERS_CACHE = $state([]);

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

		if (QUERY_CACHE.has(query)) {
			searchResults = USERS_CACHE.filter(({ firstName, lastName }) =>
				[firstName, lastName].some((item) => item.toLowerCase().includes(query))
			);
			isSearching = false;
			return;
		}

		fetch(`${USERS_API}search?q=${query}&limit=5`)
			.then((response) => response.json())
			.then((data) => {
				const { users } = data;

				QUERY_CACHE.add(query);
				const filteredUsers = users.filter(
					(user) => !USERS_CACHE.find((cachedUser) => cachedUser.id === user.id)
				);
				USERS_CACHE = [...USERS_CACHE, ...filteredUsers];

				searchResults = users;
			})
			.finally(() => {
				isSearching = false;
			});
	});

	const addUser = ({ currentTarget: { value } }) => {
		const user = searchResults.find(({ id }) => id === +value);
		users.unshift(user);
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
				USERS_CACHE = data.users;
			})
			.finally(() => (isLoadingUsers = false));
	};

	$effect(() => {
		loadUsers();
	});
</script>

<h1>Users Demo</h1>

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

{#if isLoadingUsers}
	<div aria-busy={isLoadingUsers} transition:fade>Loading users...</div>
{/if}

{#if searchResults.length}
	<article>
		{#each searchResults as { id, firstName, lastName }, index (id)}
			<div role="group" transition:fly|global={{ x: 100, delay: index * 100 }}>
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

{#if !isLoadingUsers}
	<table>
		<thead>
			<tr>
				<th scope="col">User</th>
				<th scope="col">Email</th>
				<th scope="col">Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each users as { id, firstName, email } (id)}
				<tr animate:flip={{ duration: 400 }}>
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
