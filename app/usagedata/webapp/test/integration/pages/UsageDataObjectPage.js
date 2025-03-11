sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'cap.websockets.usagedata',
            componentId: 'UsageDataObjectPage',
            contextPath: '/UsageData'
        },
        CustomPageDefinitions
    );
});