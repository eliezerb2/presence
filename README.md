1. environment
2. this is a windows host
3. use powershell and not bat files
4. never use linux commands on the host
5. never run npm, npx, pip, python or any other such thing on the host
6. do not ask for permissions, and assume you are authorized to perform the following:

   1. create, edit and delete files and folders in the vscode workspace
   2. build docker images
   3. deploy to the local rancher desktop kubernetes
   4. check the status of the deployment in kubernetes
7. code
8. do not ask what technologies to use
9. use latest technologies and packages
10. build
11. always use docker
12. always use latest docker images by not specifying a version tag
13. deployment
14. never deploy anything to the host
15. never use docker-compose
16. always deploy to the local rancher desktop kubernetes
17. use a dedicated kubernetes namespace and never use the default namespace
18. use helm to deploy the application and create all necessary kubernetes resources
19. always uninstall the helm chart and verify that all application resources are deleted before redeploying the helm chart
20. when using a solution like postgres, use existing, recommended helm charts
21. test
22. all tests should be performed in a kubernetes deployment
23. define unit tests for all methods and use them to test the all methods
24. define integration tests for all services and use them to test all services
25. define end to end tests for the entire system and use them to test the entire system
26. run the end to end tests from a pod in another namespace
27. generate test data for the tests
28. use mocking and stubbing where necessary
29. generate manual test scripts
30. process
31. involve the user only after the complete application is ready
32. use powershell and not bat files

* use powershell and not bat files
* 


* use powershell and not bat files
* 


* use powershell and not bat files
*
