grails.project.class.dir = "target/classes"
grails.project.test.class.dir = "target/test-classes"
grails.project.test.reports.dir = "target/test-reports"

grails.project.dependency.resolver = 'maven'
grails.project.dependency.resolution = {
    log "warn"
    legacyResolve false
    inherits('global') {}
    repositories {

        grailsCentral()
        mavenLocal()
        mavenCentral()
        mavenRepo 'https://repo.transmartfoundation.org/content/repositories/public/'
        mavenRepo 'https://repo.thehyve.nl/content/repositories/public/'
    }
    dependencies {
        //compile 'org.apache.hadoop:hadoop-client:2.6.0'
        compile 'org.mongodb:mongodb-driver:3.0.3'
    }
    plugins {

    }
}