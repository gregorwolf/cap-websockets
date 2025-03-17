sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'systemstatus/test/integration/FirstJourney',
		'systemstatus/test/integration/pages/SystemStatusList',
		'systemstatus/test/integration/pages/SystemStatusObjectPage'
    ],
    function(JourneyRunner, opaJourney, SystemStatusList, SystemStatusObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('systemstatus') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheSystemStatusList: SystemStatusList,
					onTheSystemStatusObjectPage: SystemStatusObjectPage
                }
            },
            opaJourney.run
        );
    }
);