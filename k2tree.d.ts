export type latitude = number;
export type longitude = number;
export type LatLonObject = { lat: latitude, lon: longitude };
export type LatLonArray = [longitude,latitude];
export type LatLon = LatLonObject | LatLonArray;
export type Points = BigUint64Array | LatLon[]
export class Tree {
  free(): void;
  constructor(points: Points);
  nearest(point: LatLon): LatLonArray;
  withinDistance(point: LatLon, distance: number): LatLonArray[];
  clusterify(distance: number): LatLonArray[][];
}
