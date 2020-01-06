import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';
import { SPADeploy } from '../lib/';

test('Cloudfront Distribution Included', () => {
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