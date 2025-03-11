using {
  cuid,
  managed
} from '@sap/cds/common';

namespace db;

entity UsageData : cuid, managed {
  type  : String;
  usage : Integer;
}
