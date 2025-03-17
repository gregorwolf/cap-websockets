using UsagePluginService as service from '../../srv/usage-plugin-service';
annotate service.SystemStatus with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'category',
                Value : category,
            },
            {
                $Type : 'UI.DataField',
                Label : 'name',
                Value : name,
            },
            {
                $Type : 'UI.DataField',
                Label : 'value',
                Value : value,
            },
            {
                $Type : 'UI.DataField',
                Label : 'numericValue',
                Value : numericValue,
            },
            {
                $Type : 'UI.DataField',
                Label : 'unit',
                Value : unit,
            },
            {
                $Type : 'UI.DataField',
                Label : 'status',
                Value : status,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'category',
            Value : category,
        },
        {
            $Type : 'UI.DataField',
            Label : 'name',
            Value : name,
        },
        {
            $Type : 'UI.DataField',
            Label : 'value',
            Value : value,
        },
        {
            $Type : 'UI.DataField',
            Label : 'numericValue',
            Value : numericValue,
        },
        {
            $Type : 'UI.DataField',
            Label : 'unit',
            Value : unit,
        },
    ],
);

