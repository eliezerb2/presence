1. environment

   1. this is a windows host
   2. use powershell and not bat files
   3. never use linux commands on the host
   4. never run npm, npx, pip, python or any other such thing on the host
   5. do not ask for permissions, and assume you are authorized to perform the following:

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
   7. when using a solution like postgres, use existing, recommended helm charts
   8. when deploying multuple pods - deploy in the order of dependency
   9. add a powershell script to undeploy - the script should verify that no resource of the app exists
5. test

   1. all tests should be performed in a kubernetes deployment
   2. define unit tests for all methods and use them to test the all methods
   3. define integration tests for all services and use them to test all services
   4. define end to end tests for the entire system and use them to test the entire system
   5. run the end to end tests from a pod in another namespace
   6. generate test data for the tests
   7. use mocking and stubbing where necessary
   8. test each service individually
   9. test the UI
   10. generate manual test scripts
6. process

   1. for ech component
      1. as an expert developer

         1. write unit tests for the code
         2. write the code
         3. use mocks to simulate integration
         4. adujst the unit tests
         5. review the code, fix and review until no comments
         6. adujst the unit tests
         7. build the docker
         8. go to the start to address any issues from the build
      2. as an expert devops

         1. add the component to the helm chart
         2. review the helm chart, fix and review until no comments
         3. deploy to run the unit tests
      3. return to the first phase of an expert developer to address any issues with the code, until all unit tests are OK
      4. if mockes were used - switch from the mocks to integration with other components and run integration tests
      5. repeat the process unitl all integration tests are OK
   2. involve the user only after the complete application is ready
   3. only perform end to end tests after integration tests complete successfully
   4. never wait without checking for something
   5. failed tests must trigger a fix and re-test
