import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';
import { registerCleanup } from '../modules';
import { globalState } from '../state';

let influxClient: InfluxDB = null;
let org: string = null;

export function initInfluxDb(url: string, org_: string, token?: string) {
  if (influxClient) {
    throw new Error('InfluxDB already initialized');
  }

  org = org_;

  influxClient = new InfluxDB({ url, token });
  console.log(`InfluxDB initialized: ${url}, org: ${org}`);
}

export function exportStateToInflux(
  bucket: string,
  stateKeys: string[] | 'all' = 'all',
  interval: number = 10000,
  tags: Record<string, string> = {},
) {
  if (!influxClient) {
    throw new Error('call initInfluxDB() first!');
  }

  let writeApi = influxClient.getWriteApi(org, bucket);

  const exportFn = async () => {
    try {
      const state = globalState.inner;
      const slicesToExport =
        stateKeys === 'all' ? Object.keys(state) : stateKeys;

      slicesToExport.forEach((sliceKey) => {
        if (!state[sliceKey]) return;

        const point = new Point(sliceKey);

        // Add default tags
        Object.entries(tags).forEach(([key, value]) => {
          point.tag(key, value);
        });

        function addFieldsFor(key: string, value: any) {
          if (key == 'time') {
            // time is a reserved keyword in InfluxDB
            key = 'time_';
          }

          if (typeof value === 'number') {
            point.floatField(key, value);
          } else if (typeof value === 'boolean') {
            point.booleanField(key, value);
          } else if (typeof value === 'string') {
            point.stringField(key, value);
          } else if (value instanceof Date) {
            point.intField(key, value.getTime());
          } else if (value == null) {
            // do nothing
          } else if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([subKey, subValue]) => {
              addFieldsFor(`${key}.${subKey}`, subValue);
            });
          } else {
            console.warn(
              `[influxdb] Unsupported type for field ${key}: ${typeof value}`,
            );
            point.stringField(key, JSON.stringify(value));
          }
        }

        // Add fields from state slice
        Object.entries(state[sliceKey]).forEach(([key, value]) => {
          addFieldsFor(key, value);
        });

        writeApi.writePoint(point);
      });

      await writeApi.flush();
    } catch (e) {
      console.error('Error exporting state to InfluxDB', e);
    }
  };

  const exportInterval = setInterval(exportFn, interval);

  registerCleanup(() => {
    clearInterval(exportInterval);
  });

  // Run initial export
  exportFn();

  return () => {
    clearInterval(exportInterval);
  };
}
