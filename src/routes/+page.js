export const load = async () => {
  return {
    users: fetch('https://dummyjson.com/users?limit=5').then((response) => response.json())
  };
};
