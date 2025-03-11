sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'cap/websockets/usagedata/test/integration/FirstJourney',
		'cap/websockets/usagedata/test/integration/pages/UsageDataList',
		'cap/websockets/usagedata/test/integration/pages/UsageDataObjectPage'
    ],
    function(JourneyRunner, opaJourney, UsageDataList, UsageDataObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('cap/websockets/usagedata') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheUsageDataList: UsageDataList,
					onTheUsageDataObjectPage: UsageDataObjectPage
                }
            },
            opaJourney.run
        );
    }
);