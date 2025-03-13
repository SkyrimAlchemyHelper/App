export const idFormatter = (v: number) => {
  return Array.prototype.map
    .call(new Uint8Array(new Uint32Array([v]).buffer), (n) =>
      n.toString(16).padStart(2, '0'),
    )
    .join('')
    .padStart(8, '0')
    .toUpperCase();
};

export default idFormatter;
