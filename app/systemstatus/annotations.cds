using UsagePluginService as service from '../../srv/usage-plugin-service';

annotate service.SystemStatus with @(
    UI.SelectionFields           : [
        'category',
        'name',
        'value'
    ],
    UI.LineItem                  : [
        {Value: category, },
        {Value: name, },
        {Value: value, },
        {Value: numericValue, },
        {Value: unit, },
        {Value: modifiedAt, },
    ],
    UI.FieldGroup #GeneratedGroup: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {Value: category, },
            {Value: name, },
            {Value: value, },
            {Value: numericValue, },
            {Value: unit, },
            {Value: status, },
            {Value: modifiedAt, },
        ],
    },
    UI.Facets                    : [{
        $Type : 'UI.ReferenceFacet',
        ID    : 'GeneratedFacet1',
        Label : 'General Information',
        Target: '@UI.FieldGroup#GeneratedGroup',
    }, ],
);
