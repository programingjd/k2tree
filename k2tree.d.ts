export class Tree {
  free(): void;
  // @ts-ignore
  constructor(points: BigUint64Array);
  nearest(lat: number, lon: number): bigint;
  // @ts-ignore
  within_distance(lat: number, lon: number, distance: number): BigUint64Array;
  // @ts-ignore
  clusterify(distance: number): (BigUint64Array)[];
}
