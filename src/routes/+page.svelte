<script>
	const { data } = $props();
	const { users = [] } = data;

	let usersSelected = $state([]);
	const { users: currentUsers } = users;

	const loadUsers = async () => {
		const localUsers = await users;

		return localUsers;
	};

	const deleteUsers = async () => {
		let deleted = [];

		for (let i = 0; i < usersSelected.length; ++i) {
			await fetch(`https://dummyjson.com/users/${usersSelected[i]}`, { method: 'DELETE' })
				.then((res) => {
					if (res.ok) {
						return res.json();
					}
					throw new Error(res.json());
				})
				.then((data) => {
					if (data.isDeleted) {
						deleted.push(data.firstName);
					}
				})
				.catch((err) => console.log('BAD: ', err));
		}

		alert(`Usuarios eliminados: ${JSON.stringify(deleted)}`);
		usersSelected = [];
	};
</script>

<h1>Users Demo</h1>
<section>
	<button type="button" disabled={!usersSelected.length} onclick={deleteUsers}
		>Eliminar usuarios</button
	>
</section>

{#await users}
	<div aria-busy="true">Loading</div>
{:then data}
	<table>
		<thead>
			<tr>
				<th scope="col">Usuario</th>
				<th scope="col">Email</th>
				<th scope="col"></th>
			</tr>
		</thead>
		<tbody>
			{#each data.users as { id, firstName, email } (id)}
				<tr>
					<td>
						<label for={`user-${id}`}>{firstName}</label>
					</td>
					<td>
						<label for={`user-${id}`}>{email}</label>
					</td>
					<td><input id={`user-${id}`} type="checkbox" value={id} bind:group={usersSelected} /></td>
				</tr>
			{:else}
				<tr>
					<td colspan="3">Sin usuarios</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/await}

<style>
	label {
		cursor: pointer;
	}
</style>
