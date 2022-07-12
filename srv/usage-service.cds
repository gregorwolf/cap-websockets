@(requires : 'authenticated-user')
service UsageService {

  @odata.singleton
  @cds.persistence.exists : true
  entity cpu {
    usage        : Integer;
    virtual user : String;
  }

}
