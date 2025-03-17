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

  entity UsageData as projection on db.UsageData;
}
