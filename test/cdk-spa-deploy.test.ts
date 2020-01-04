import { expect as expectCDK, matchTemplate, MatchStyle, haveResource } from '@aws-cdk/assert';
import { App, Stack } from '@aws-cdk/core';
import { SPADeploy } from '../src/spa-deploy-construct';

test('Empty Stack', () => {
    const app = new App();
    let stack = new Stack();
    // WHEN
    let deploy = new SPADeploy(stack, 'spaDeploy');
    
    deploy.createSiteWithCloudfront({
      indexDoc: 'index.html',
      websiteFolder: 'website'
    })
    // THEN
    expectCDK(stack).to(haveResource('AWS::S3::Bucket'));
});