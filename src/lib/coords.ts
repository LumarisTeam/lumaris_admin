/**
 * GCJ-02（火星坐标）与 WGS-84 互转。
 *
 * 背景：POI 入库的经纬度是 GCJ-02（与 App 的高德底图同源），管理端地图用的是
 * Leaflet + OpenStreetMap（WGS-84）。两者直接叠加会整体向东南偏约 500m，
 * 所以渲染前需要把 GCJ-02 反解成 WGS-84，存储值保持不变。
 */

const A = 6378245.0;
const EE = 0.00669342162296594323;
const PI = Math.PI;

/** 中国境外不做偏移 */
function outOfChina(latitude: number, longitude: number): boolean {
  return (
    longitude < 72.004 ||
    longitude > 137.8347 ||
    latitude < 0.8293 ||
    latitude > 55.8271
  );
}

function transformLat(x: number, y: number): number {
  let ret =
    -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3;
  ret += ((20 * Math.sin(y * PI) + 40 * Math.sin((y / 3) * PI)) * 2) / 3;
  ret += ((160 * Math.sin((y / 12) * PI) + 320 * Math.sin((y * PI) / 30)) * 2) / 3;
  return ret;
}

function transformLon(x: number, y: number): number {
  let ret =
    300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3;
  ret += ((20 * Math.sin(x * PI) + 40 * Math.sin((x / 3) * PI)) * 2) / 3;
  ret += ((150 * Math.sin((x / 12) * PI) + 300 * Math.sin((x / 30) * PI)) * 2) / 3;
  return ret;
}

/** WGS-84 → GCJ-02 */
export function wgs84ToGcj02(
  latitude: number,
  longitude: number,
): [number, number] {
  if (outOfChina(latitude, longitude)) return [latitude, longitude];

  let dLat = transformLat(longitude - 105, latitude - 35);
  let dLon = transformLon(longitude - 105, latitude - 35);
  const radLat = (latitude / 180) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
  dLon = (dLon * 180) / ((A / sqrtMagic) * Math.cos(radLat) * PI);
  return [latitude + dLat, longitude + dLon];
}

/** GCJ-02 → WGS-84（不动点迭代反解，3 次后误差在 1m 以内） */
export function gcj02ToWgs84(
  latitude: number,
  longitude: number,
): [number, number] {
  if (outOfChina(latitude, longitude)) return [latitude, longitude];

  let wgsLat = latitude;
  let wgsLng = longitude;
  for (let i = 0; i < 3; i++) {
    const [gcjLat, gcjLng] = wgs84ToGcj02(wgsLat, wgsLng);
    wgsLat += latitude - gcjLat;
    wgsLng += longitude - gcjLng;
  }
  return [wgsLat, wgsLng];
}
