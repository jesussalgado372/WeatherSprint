const saveToStorage = (item) => {
  let favorites = getLocalStorage();
  if (!favorites.includes(item)) {
    favorites.push(item);
  }
  localStorage.setItem("Favorites", JSON.stringify(favorites));
};

const getLocalStorage = () => {
  const value = localStorage.getItem("Favorites");
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch (err) {
    console.error("Error parsing localStorage", err);
    return [];
  }
};

const removeFromStorage = (item) => {
  let favorites = getLocalStorage();
  const index = favorites.indexOf(item);
  if (index > -1) {
    favorites.splice(index, 1);
    localStorage.setItem("Favorites", JSON.stringify(favorites));
  }
};

export { saveToStorage, getLocalStorage, removeFromStorage };
