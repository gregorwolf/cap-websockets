using {db} from '../db/schema';


@(requires: 'authenticated-user')
@protocol: [
  'websocket',
  'odata'
]

service UsagePluginService {
  event cpu {
    usage : Integer;
  }
  
  event memory {
    usage : Integer;
  }


  event entityUpdated {
    entity : String;
    operation : String;
    data: {
      type: String;
      usage: Integer;
    };
    keys: {
      type: String;
      usage: Integer;
    };
  }

  entity UsageData as projection on db.UsageData;
  entity SystemStatus as projection on db.SystemStatus;
}
