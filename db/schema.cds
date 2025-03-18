using {
  cuid,
  managed
} from '@sap/cds/common';

namespace db;

entity UsageData : cuid, managed {
  type  : String;
  usage : Integer;
}

entity SystemStatus : cuid, managed {
  category    : String; // e.g., 'disk', 'network', 'os', etc.
  name        : String; // metric name
  value       : String; // string value to accommodate different data types
  numericValue: Decimal; // for numeric values that can be graphed
  unit        : String; // e.g., '%', 'GB', 'MB/s'
  status      : String; // 'normal', 'warning', 'critical'
}
