1. environment
   1. this is a windows host
   2. never use linux commands on the host
   3. never run npm, npx, python or any other such thing on the host
   4. do not ask for permissions, and assume you are authorized to perform the following:
      1. create, edit and delete files and folders in the vscode workspace
      2. build docker images
      3. deploy to the local rancher desktop kubernetes
      4. check the status of the deployment in kubernetes
2. code
   1. do not ask what technologies to use
   2. use latest technologies and packages
3. build
   1. always use docker
   2. always use latest docker images by not specifying a version tag
4. deployment
   1. never deploy anything to the host
   2. never use docker-compose
   3. always deploy to the local rancher desktop kubernetes
   4. use a dedicated kubernetes namespace and never use the default namespace
   5. use helm to deploy the application and create all necessary kubernetes resources
   6. always uninstall the helm chart and verify that all application resources are deleted before redeploying the helm chart
5. test
   1. all tests should be performed in a kubernetes deployment
   2. define unit tests for all methods and use them to test the all methods
   3. define integration tests for all services and use them to test all services
   4. define end to end tests for the entire system and use them to test the entire system
   5. run the end to end tests from a pod in another namespace
   6. generate test data for the tests
   7. use mocking and stubbing where necessary
   8. generate manual test scripts
6. process
   1. involve the user only after the complete application is ready
