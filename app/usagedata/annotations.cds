using UsagePluginService as service from '../../srv/usage-plugin-service';

annotate service.UsageData with @(
    UI.FieldGroup #GeneratedGroup: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Label: 'type',
                Value: type,
            },
            {
                $Type: 'UI.DataField',
                Label: 'usage',
                Value: usage,
            },
        ],
    },
    UI.Facets                    : [{
        $Type : 'UI.ReferenceFacet',
        ID    : 'GeneratedFacet1',
        Label : 'General Information',
        Target: '@UI.FieldGroup#GeneratedGroup',
    }, ],
    UI.LineItem                  : [
        {
            $Type: 'UI.DataField',
            Value: createdAt,
        },
        {
            $Type: 'UI.DataField',
            Label: 'type',
            Value: type,
        },
        {
            $Type: 'UI.DataField',
            Label: 'usage',
            Value: usage,
        },
    ],
);
