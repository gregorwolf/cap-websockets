@(requires: 'authenticated-user')
@ws
service UsagePluginService {
  event cpu {
    usage : Integer;
  }
}
