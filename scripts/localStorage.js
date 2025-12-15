const saveToStorage = (item) => {
  let listArr = getLocalStorage();
  if (!listArr.includes(item)) {
    listArr.push(item);
  }
  localStorage.setItem("Items", JSON.stringify(listArr));
};

const getLocalStorage = () => {
  let value = localStorage.getItem("Items");
  if (value === null) {
    return [];
  }
  return JSON.parse(value);
};

const removeFromStorage = (Item) => {
  let listArr = getLocalStorage();
  let index = listArr.indexOf(Item);
  listArr.splice(index, 1);
  localStorage.setItem("Items", JSON.stringify(listArr));
};

export { saveToStorage, getLocalStorage, removeFromStorage};
