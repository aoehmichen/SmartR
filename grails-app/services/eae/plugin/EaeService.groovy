package eae.plugin

class EaeService {

    /**
     *   Renders the default view
     */
    def getHpcScriptList() {
        def scriptList = ['Cross Validation', 'GWAS - LP', 'Pathway Enrichment', 'General Testing']
        return scriptList
    }

    def sparkSubmit(String scriptDir, String sparkParameters){
        def script = scriptDir +'executeSparkJob.sh'

        def scriptFile = new File(script)
        if (scriptFile.exists()) {
            if (!scriptFile.canExecute()) {
                scriptFile.setExecutable(true)
            }
        }else {
            log.error('The Script file spark submit wasn\'t found')
        }
        def executeCommand = script + " " + sparkParameters
        println(executeCommand)
        executeCommand.execute().waitFor()
        return 0
    }

}