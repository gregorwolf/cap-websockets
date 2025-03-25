using {db} from '../db/schema';


@(requires: [
  'authenticated-user',
  'internal-user'
])
@protocol: [
  'websocket',
  'odata'
]

type metric : {
  category     : db.SystemStatus:category;
  name         : db.SystemStatus:name;
  value        : db.SystemStatus:value;
  numericValue : db.SystemStatus:numericValue;
  unit         : db.SystemStatus:unit;
  status       : db.SystemStatus:status
};

service UsagePluginService {
  event cpu {
    usage : Integer;
  }

  event memory {
    usage : Integer;
  }

  event systemStatus {
    metrics : array of metric;
  }

  event entityUpdated {
    entity    : String;
    operation : String;
    data      : {
      type    : String;
      usage   : Integer;
    };
    keys      : {
      type    : String;
      usage   : Integer;
    };
  }

  entity UsageData    as projection on db.UsageData;
  entity SystemStatus as projection on db.SystemStatus;
}
