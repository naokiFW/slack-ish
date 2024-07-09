export function quicksort(startID, endID, msg) {
  var pivot = msg[Math.floor((startID + endID) / 2)].id;
  var left = startID;
  var right = endID;

  while (true) {
    while (msg[left].id < pivot) {
      left++;
    }

    while (pivot < msg[right].id) {
      right--;
    }

    if (right <= left) {
      break;
    }


    var tmp = msg[left];
    msg[left] = msg[right];
    msg[right] = tmp;
    left++;
    right--;
  }

  if (startID < left - 1) {
    quicksort(startID, left - 1, msg);
  }

  if (right + 1 < endID) {
    quicksort(right + 1, endID, msg);
  }

  return msg;
}