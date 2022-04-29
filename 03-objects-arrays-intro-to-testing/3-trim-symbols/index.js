/**
 * trimSymbols - removes consecutive identical symbols if their quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  if (size == null) {
    return string;
  }

  let counter = 0;
  return string.split('')
    .filter((value, index, array) => {
      counter = value === array[index + 1] ? counter + 1 : 0;
      return counter < size;
    })
    .join('');
}
