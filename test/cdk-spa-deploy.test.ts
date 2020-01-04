import { expect as expectCDK, matchTemplate, MatchStyle, haveResource } from '@aws-cdk/assert';
import { App, Stack } from '@aws-cdk/core';
import { SPADeploy } from '../src/spa-deploy-construct';

test('Cloudfront Distribution Included', () => {
    const app = new App();
    let stack = new Stack();
    // WHEN
    let deploy = new SPADeploy(stack, 'spaDeploy');
    
    deploy.createSiteWithCloudfront({
      indexDoc: 'index.html',
      websiteFolder: 'website'
    })
    // THEN
    expectCDK(stack).to(haveResource('AWS::CloudFront::Distribution'));
});

test('Basic Site Setup', () => {
    const app = new App();
    let stack = new Stack();
    // WHEN
    let deploy = new SPADeploy(stack, 'spaDeploy');
    
    deploy.createBasicSite({
      indexDoc: 'index.html',
      websiteFolder: 'website'
    })
    // THEN
    expectCDK(stack).to(haveResource('AWS::S3::Bucket'));
    expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));
});