const uniqueItems = (list, keyFn) =>
  list.reduce(
    (resultSet, item) =>
      resultSet.add(typeof keyFn === "string" ? item[keyFn] : keyFn(item)),
    new Set()
  ).size;

export default uniqueItems;
