
export function objMap(obj, fn, ...args) {
  const out = {};
  for(const key in obj) {
    out[key] = fn(obj[key], ...args);
  }
  return out;
}

export function selectKeys(obj, keys) {
  const out = {};
  for(const k in keys) {
    if(obj[keys[k]] !== undefined) {
      out[keys[k]] = obj[keys[k]];
    }
  }
  return out
};

